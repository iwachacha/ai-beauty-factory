import type {
  CreateStudioContentDraftRequest,
  CreateStudioPublishedPostRequest,
  CreateStudioPublishPackageRequest,
} from './studio.contracts'
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { StudioCharacterProfileEntity } from './storage/studio-character-profile.schema'
import { StudioContentDraftEntity } from './storage/studio-content-draft.schema'
import { StudioGeneratedAssetEntity } from './storage/studio-generated-asset.schema'
import { StudioGenerationRunEntity } from './storage/studio-generation-run.schema'
import { StudioPromptTemplateEntity } from './storage/studio-prompt-template.schema'
import { StudioPublishPackageEntity } from './storage/studio-publish-package.schema'
import { StudioPublishedPostEntity } from './storage/studio-published-post.schema'
import { StudioChannelAccountService } from './studio-channel-account.service'
import { buildDefaultPublishChecklist, normalizeHashtag } from './studio.constants'

@Injectable()
export class StudioPublishingService {
  constructor(
    @InjectModel(StudioGeneratedAssetEntity.name)
    private readonly generatedAssetModel: Model<StudioGeneratedAssetEntity>,
    @InjectModel(StudioContentDraftEntity.name)
    private readonly contentDraftModel: Model<StudioContentDraftEntity>,
    @InjectModel(StudioPublishPackageEntity.name)
    private readonly publishPackageModel: Model<StudioPublishPackageEntity>,
    @InjectModel(StudioPublishedPostEntity.name)
    private readonly publishedPostModel: Model<StudioPublishedPostEntity>,
    @InjectModel(StudioGenerationRunEntity.name)
    private readonly generationRunModel: Model<StudioGenerationRunEntity>,
    @InjectModel(StudioCharacterProfileEntity.name)
    private readonly characterModel: Model<StudioCharacterProfileEntity>,
    @InjectModel(StudioPromptTemplateEntity.name)
    private readonly templateModel: Model<StudioPromptTemplateEntity>,
    private readonly channelAccountService: StudioChannelAccountService,
  ) {}

  async listDrafts(userId: string) {
    return await this.contentDraftModel.find({ userId }).sort({ updatedAt: -1 }).lean({ virtuals: true }).exec()
  }

  async listPublishPackages(userId: string) {
    return await this.publishPackageModel.find({ userId }).sort({ exportedAt: -1 }).lean({ virtuals: true }).exec()
  }

  async createDraft(userId: string, body: CreateStudioContentDraftRequest) {
    const asset = await this.generatedAssetModel.findOne({ _id: body.generatedAssetId, userId }).lean({ virtuals: true }).exec()
    if (!asset) {
      throw new NotFoundException('Generated asset not found')
    }
    if (asset.reviewStatus !== 'approved') {
      throw new UnprocessableEntityException('Only approved assets can become drafts')
    }

    const defaults = await this.buildDraftDefaults(userId, asset.generationRunId)
    const captionOptions = body.captionOptions.length > 0 ? body.captionOptions : defaults.captionOptions
    const hashtags = (body.hashtags.length > 0 ? body.hashtags : defaults.hashtags)
      .map(normalizeHashtag)
      .filter(Boolean)

    return await this.contentDraftModel.findOneAndUpdate(
      { userId, generatedAssetId: asset.id },
      {
        $set: {
          userId,
          generatedAssetId: asset.id,
          captionOptions,
          hashtags,
          cta: body.cta || defaults.cta,
          publishNote: body.publishNote,
          status: body.status,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean({ virtuals: true }).exec()
  }

  async createPublishPackage(userId: string, body: CreateStudioPublishPackageRequest) {
    const [draft, activeChannel] = await Promise.all([
      this.contentDraftModel.findOne({ _id: body.contentDraftId, userId }).lean({ virtuals: true }).exec(),
      this.channelAccountService.getActive(userId),
    ])

    if (!draft) {
      throw new NotFoundException('Content draft not found')
    }
    if (!activeChannel) {
      throw new UnprocessableEntityException('Activate an X account before exporting a publish package')
    }

    const asset = await this.generatedAssetModel.findOne({ _id: draft.generatedAssetId, userId }).lean({ virtuals: true }).exec()
    if (!asset || asset.reviewStatus !== 'approved') {
      throw new UnprocessableEntityException('Publish packages require an approved asset')
    }

    const finalCaption = body.finalCaption || draft.captionOptions[0] || ''
    if (!finalCaption) {
      throw new UnprocessableEntityException('A final caption is required')
    }

    await this.contentDraftModel.findByIdAndUpdate(draft.id, { $set: { status: 'ready' } }).exec()

    return await this.publishPackageModel.findOneAndUpdate(
      { userId, contentDraftId: draft.id },
      {
        $set: {
          userId,
          contentDraftId: draft.id,
          channelAccountId: activeChannel.id,
          finalCaption,
          assetRefs: [
            {
              assetId: asset.assetId,
              previewUrl: asset.previewUrl,
            },
          ],
          checklist: body.checklist.length > 0 ? body.checklist : buildDefaultPublishChecklist(),
          status: 'prepared',
          exportedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean({ virtuals: true }).exec()
  }

  async recordPublishedPost(userId: string, body: CreateStudioPublishedPostRequest) {
    const publishPackage = await this.publishPackageModel.findOne({ _id: body.publishPackageId, userId }).lean({ virtuals: true }).exec()
    if (!publishPackage) {
      throw new NotFoundException('Publish package not found')
    }

    await this.publishPackageModel.findByIdAndUpdate(publishPackage.id, { $set: { status: 'published' } }).exec()

    return await this.publishedPostModel.findOneAndUpdate(
      { userId, publishPackageId: publishPackage.id },
      {
        $set: {
          userId,
          publishPackageId: publishPackage.id,
          platformPostUrl: body.platformPostUrl,
          publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
          manualMetrics: body.manualMetrics,
          operatorMemo: body.operatorMemo,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean({ virtuals: true }).exec()
  }

  async getInsights(userId: string) {
    const [items, pendingPublishPackages] = await Promise.all([
      this.publishedPostModel.find({ userId }).sort({ publishedAt: -1 }).lean({ virtuals: true }).exec(),
      this.publishPackageModel.find({ userId, status: 'prepared' }).sort({ exportedAt: -1 }).lean({ virtuals: true }).exec(),
    ])

    const summary = items.reduce((acc, item) => {
      acc.totalPosts += 1
      acc.totalImpressions += item.manualMetrics.impressions
      acc.totalLikes += item.manualMetrics.likes
      acc.totalReposts += item.manualMetrics.reposts
      acc.totalReplies += item.manualMetrics.replies
      acc.totalBookmarks += item.manualMetrics.bookmarks
      acc.totalProfileVisits += item.manualMetrics.profileVisits
      acc.totalLinkClicks += item.manualMetrics.linkClicks
      return acc
    }, {
      totalPosts: 0,
      totalImpressions: 0,
      totalLikes: 0,
      totalReposts: 0,
      totalReplies: 0,
      totalBookmarks: 0,
      totalProfileVisits: 0,
      totalLinkClicks: 0,
    })

    return {
      summary,
      items,
      pendingPublishPackages,
    }
  }

  private async buildDraftDefaults(userId: string, generationRunId: string) {
    const run = await this.generationRunModel.findOne({ _id: generationRunId, userId }).lean({ virtuals: true }).exec()
    if (!run) {
      return {
        captionOptions: ['投稿用キャプションをここに入力'],
        hashtags: ['#AIGirl', '#XDaily'],
        cta: '気に入ったらリアクションお願いします。',
      }
    }

    const [character, template] = await Promise.all([
      this.characterModel.findOne({ _id: run.characterId, userId }).lean({ virtuals: true }).exec(),
      this.templateModel.findOne({ _id: run.templateId, userId }).lean({ virtuals: true }).exec(),
    ])

    const displayName = character?.displayName || 'Studio Character'
    const scene = template?.scene || 'daily scene'
    const intent = template?.intent || 'quiet mood'
    const hashtags = [
      '#AIBeauty',
      normalizeHashtag(displayName),
      normalizeHashtag(scene),
    ].filter(Boolean)

    return {
      captionOptions: [
        `${displayName}の${scene}ショット。${intent}を静かにまとめた一枚です。`,
        `${scene}の空気感を大切にしながら、${displayName}らしさを残しました。`,
        `${displayName}の今日の雰囲気を切り取った、${intent}寄りのカットです。`,
      ],
      hashtags,
      cta: 'よければ感想をリプで教えてください。',
    }
  }
}
