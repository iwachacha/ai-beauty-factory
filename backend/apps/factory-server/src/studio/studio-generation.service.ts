import type { StudioGenerationProvider } from './providers/generation-provider.interface'
import type {
  CreateStudioGenerationRunRequest,
  ReviewStudioGeneratedAssetRequest,
} from './studio.contracts'
import { randomInt } from 'node:crypto'
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PromptComposerService } from './prompt-composer.service'
import { StudioCharacterProfileEntity } from './storage/studio-character-profile.schema'
import { StudioGeneratedAssetEntity } from './storage/studio-generated-asset.schema'
import { StudioGenerationRunEntity } from './storage/studio-generation-run.schema'
import { StudioPromptTemplateEntity } from './storage/studio-prompt-template.schema'
import {
  applyReviewToQualityChecks,
  createPendingQualityChecks,
  STUDIO_DEFAULT_HEIGHT,
  STUDIO_DEFAULT_MODEL,
  STUDIO_DEFAULT_WIDTH,
  STUDIO_DEFAULT_WORKFLOW_VERSION,
} from './studio.constants'

@Injectable()
export class StudioGenerationService {
  constructor(
    @InjectModel(StudioCharacterProfileEntity.name)
    private readonly characterModel: Model<StudioCharacterProfileEntity>,
    @InjectModel(StudioPromptTemplateEntity.name)
    private readonly templateModel: Model<StudioPromptTemplateEntity>,
    @InjectModel(StudioGenerationRunEntity.name)
    private readonly generationRunModel: Model<StudioGenerationRunEntity>,
    @InjectModel(StudioGeneratedAssetEntity.name)
    private readonly generatedAssetModel: Model<StudioGeneratedAssetEntity>,
    private readonly promptComposer: PromptComposerService,
    @Inject('STUDIO_GENERATION_PROVIDER')
    private readonly generationProvider: StudioGenerationProvider,
  ) {}

  async listRuns(userId: string) {
    return await this.generationRunModel.find({ userId }).sort({ createdAt: -1 }).lean({ virtuals: true }).exec()
  }

  async getRun(userId: string, runId: string) {
    const run = await this.generationRunModel.findOne({ _id: runId, userId }).lean({ virtuals: true }).exec()
    if (!run) {
      throw new NotFoundException('Generation run not found')
    }

    const assets = await this.generatedAssetModel.find({ userId, generationRunId: run.id }).sort({ createdAt: 1 }).lean({ virtuals: true }).exec()
    return { run, assets }
  }

  async listAssets(userId: string) {
    return await this.generatedAssetModel.find({ userId }).sort({ createdAt: -1 }).lean({ virtuals: true }).exec()
  }

  async createRun(userId: string, body: CreateStudioGenerationRunRequest) {
    const [character, template] = await Promise.all([
      this.characterModel.findOne({ _id: body.characterId, userId }).lean({ virtuals: true }).exec(),
      this.templateModel.findOne({ _id: body.templateId, userId }).lean({ virtuals: true }).exec(),
    ])

    if (!character) {
      throw new UnprocessableEntityException('Character not found')
    }
    if (!template) {
      throw new UnprocessableEntityException('Template not found')
    }

    const promptSnapshot = this.promptComposer.compose({
      character,
      template,
      tier: body.targetTier,
    })

    const parameterSnapshot = {
      seed: randomInt(1, 1_000_000_000),
      model: process.env['COMFYUI_MODEL'] || STUDIO_DEFAULT_MODEL,
      width: Number(process.env['COMFYUI_WIDTH'] || STUDIO_DEFAULT_WIDTH),
      height: Number(process.env['COMFYUI_HEIGHT'] || STUDIO_DEFAULT_HEIGHT),
      workflowVersion: STUDIO_DEFAULT_WORKFLOW_VERSION,
      faceReferenceAssetIds: character.faceReferenceAssetIds,
      serverAddress: process.env['COMFYUI_SERVER_ADDRESS'] || '127.0.0.1:8188',
    }

    const createdRun = await this.generationRunModel.create({
      userId,
      characterId: character.id,
      templateId: template.id,
      targetPlatform: body.targetPlatform,
      targetTier: body.targetTier,
      workflowVersion: parameterSnapshot.workflowVersion,
      promptSnapshot,
      parameterSnapshot,
      status: 'queued',
      error: null,
      providerJobId: null,
      startedAt: null,
      completedAt: null,
    })

    try {
      const startedRun = await this.generationRunModel.findByIdAndUpdate(
        createdRun._id,
        { $set: { status: 'running', startedAt: new Date() } },
        { new: true },
      ).lean({ virtuals: true }).exec()

      const providerResult = await this.generationProvider.generate({
        positivePrompt: promptSnapshot.positivePrompt,
        negativePrompt: promptSnapshot.negativePrompt,
        workflowVersion: parameterSnapshot.workflowVersion,
        seed: parameterSnapshot.seed,
        model: parameterSnapshot.model,
        width: parameterSnapshot.width,
        height: parameterSnapshot.height,
      })

      await this.generatedAssetModel.insertMany(providerResult.images.map(image => ({
        userId,
        generationRunId: String(createdRun._id),
        assetId: image.assetId,
        previewUrl: image.previewUrl,
        reviewStatus: 'pending_review',
        surfaceFit: null,
        reviewScore: null,
        rejectionReasons: [],
        operatorNote: '',
        qualityChecks: createPendingQualityChecks(),
      })))

      await this.generationRunModel.findByIdAndUpdate(createdRun._id, {
        $set: {
          status: 'completed',
          providerJobId: providerResult.providerJobId,
          error: null,
          startedAt: startedRun?.startedAt || new Date(),
          completedAt: new Date(),
        },
      }).exec()
    }
    catch (error) {
      await this.generationRunModel.findByIdAndUpdate(createdRun._id, {
        $set: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Generation failed',
          completedAt: new Date(),
        },
      }).exec()
    }

    return await this.getRun(userId, String(createdRun._id))
  }

  async reviewAsset(userId: string, generatedAssetId: string, body: ReviewStudioGeneratedAssetRequest) {
    const asset = await this.generatedAssetModel.findOne({ _id: generatedAssetId, userId }).lean({ virtuals: true }).exec()
    if (!asset) {
      throw new NotFoundException('Generated asset not found')
    }

    const nextStatus = body.decision === 'approve'
      ? 'approved'
      : body.decision === 'needs_regenerate'
        ? 'needs_regenerate'
        : 'rejected'

    return await this.generatedAssetModel.findByIdAndUpdate(
      generatedAssetId,
      {
        $set: {
          reviewStatus: nextStatus,
          surfaceFit: body.decision === 'approve' ? body.surfaceFit ?? null : null,
          reviewScore: body.reviewScore ?? null,
          rejectionReasons: body.decision === 'approve' ? [] : body.rejectionReasons,
          operatorNote: body.operatorNote,
          qualityChecks: applyReviewToQualityChecks(asset.qualityChecks, body.decision, body.rejectionReasons),
        },
      },
      { new: true },
    ).lean({ virtuals: true }).exec()
  }
}
