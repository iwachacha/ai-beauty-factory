import type {
  CreateStudioContentDraftRequest,
  CreateStudioFunnelMetricsRequest,
  CreateStudioPaidOfferPackageRequest,
  CreateStudioPublicPostPackageRequest,
} from './studio.contracts'
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { StudioCharacterProfileEntity } from './storage/studio-character-profile.schema'
import { StudioContentDraftEntity } from './storage/studio-content-draft.schema'
import { StudioFunnelMetricsEntity } from './storage/studio-funnel-metrics.schema'
import { StudioGeneratedAssetEntity } from './storage/studio-generated-asset.schema'
import { StudioGenerationRunEntity } from './storage/studio-generation-run.schema'
import { StudioPaidOfferPackageEntity } from './storage/studio-paid-offer-package.schema'
import { StudioPromptTemplateEntity } from './storage/studio-prompt-template.schema'
import { StudioPublicPostPackageEntity } from './storage/studio-public-post-package.schema'
import { StudioChannelAccountService } from './studio-channel-account.service'
import { StudioOperatorConfigService } from './studio-operator-config.service'
import {
  buildDefaultPaidOfferChecklist,
  buildDefaultPublicPostChecklist,
  normalizeHashtag,
} from './studio.constants'

@Injectable()
export class StudioPublishingService {
  constructor(
    @InjectModel(StudioGeneratedAssetEntity.name)
    private readonly generatedAssetModel: Model<StudioGeneratedAssetEntity>,
    @InjectModel(StudioContentDraftEntity.name)
    private readonly contentDraftModel: Model<StudioContentDraftEntity>,
    @InjectModel(StudioPublicPostPackageEntity.name)
    private readonly publicPostPackageModel: Model<StudioPublicPostPackageEntity>,
    @InjectModel(StudioPaidOfferPackageEntity.name)
    private readonly paidOfferPackageModel: Model<StudioPaidOfferPackageEntity>,
    @InjectModel(StudioFunnelMetricsEntity.name)
    private readonly funnelMetricsModel: Model<StudioFunnelMetricsEntity>,
    @InjectModel(StudioGenerationRunEntity.name)
    private readonly generationRunModel: Model<StudioGenerationRunEntity>,
    @InjectModel(StudioCharacterProfileEntity.name)
    private readonly characterModel: Model<StudioCharacterProfileEntity>,
    @InjectModel(StudioPromptTemplateEntity.name)
    private readonly templateModel: Model<StudioPromptTemplateEntity>,
    private readonly operatorConfigService: StudioOperatorConfigService,
    private readonly channelAccountService: StudioChannelAccountService,
  ) {}

  async listDrafts(userId: string) {
    return await this.contentDraftModel.find({ userId }).sort({ updatedAt: -1 }).lean({ virtuals: true }).exec()
  }

  async listPublicPostPackages(userId: string) {
    return await this.publicPostPackageModel.find({ userId }).sort({ exportedAt: -1 }).lean({ virtuals: true }).exec()
  }

  async listPaidOfferPackages(userId: string) {
    return await this.paidOfferPackageModel.find({ userId }).sort({ exportedAt: -1 }).lean({ virtuals: true }).exec()
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
    const publicCaptionOptions = body.publicCaptionOptions.length > 0 ? body.publicCaptionOptions : defaults.publicCaptionOptions
    const publicHashtags = (body.publicHashtags.length > 0 ? body.publicHashtags : defaults.publicHashtags)
      .map(normalizeHashtag)
      .filter(Boolean)
    const publicCtaLabel = body.publicCtaLabel || defaults.publicCtaLabel
    const publicCtaUrl = body.publicCtaUrl || defaults.publicCtaUrl

    return await this.contentDraftModel.findOneAndUpdate(
      { userId, generatedAssetId: asset.id },
      {
        $set: {
          userId,
          generatedAssetId: asset.id,
          publicCaptionOptions,
          publicHashtags,
          publicCtaLabel,
          publicCtaUrl,
          publicPostNote: body.publicPostNote,
          paidTitle: body.paidTitle || defaults.paidTitle,
          paidHook: body.paidHook || defaults.paidHook,
          paidBody: body.paidBody || defaults.paidBody,
          paidOfferNote: body.paidOfferNote,
          status: body.status,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean({ virtuals: true }).exec()
  }

  async createPublicPostPackage(userId: string, body: CreateStudioPublicPostPackageRequest) {
    const [draft, activeChannel] = await Promise.all([
      this.contentDraftModel.findOne({ _id: body.contentDraftId, userId }).lean({ virtuals: true }).exec(),
      this.channelAccountService.getActive(userId),
    ])

    if (!draft) {
      throw new NotFoundException('Content draft not found')
    }
    if (!activeChannel) {
      throw new UnprocessableEntityException('Activate an X account before exporting a public package')
    }

    const asset = await this.generatedAssetModel.findOne({ _id: draft.generatedAssetId, userId }).lean({ virtuals: true }).exec()
    if (!asset || asset.reviewStatus !== 'approved') {
      throw new UnprocessableEntityException('Public packages require an approved asset')
    }
    if (asset.surfaceFit !== 'public_safe') {
      throw new UnprocessableEntityException('Only public_safe assets can become public packages')
    }

    const finalCaption = body.finalCaption || draft.publicCaptionOptions[0] || ''
    const ctaLabel = body.ctaLabel || draft.publicCtaLabel
    const ctaUrl = body.ctaUrl || draft.publicCtaUrl
    if (!finalCaption || !ctaLabel || !ctaUrl) {
      throw new UnprocessableEntityException('Public packages require caption and CTA details')
    }

    await this.contentDraftModel.findByIdAndUpdate(draft.id, { $set: { status: 'ready' } }).exec()

    return await this.publicPostPackageModel.findOneAndUpdate(
      { userId, contentDraftId: draft.id },
      {
        $set: {
          userId,
          contentDraftId: draft.id,
          channelAccountId: activeChannel.id,
          publicChannel: 'x',
          finalCaption,
          hashtags: draft.publicHashtags,
          ctaLabel,
          ctaUrl,
          assetRefs: [
            {
              assetId: asset.assetId,
              previewUrl: asset.previewUrl,
            },
          ],
          checklist: body.checklist.length > 0 ? body.checklist : buildDefaultPublicPostChecklist(),
          status: 'prepared',
          exportedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean({ virtuals: true }).exec()
  }

  async createPaidOfferPackage(userId: string, body: CreateStudioPaidOfferPackageRequest) {
    const [draft, config] = await Promise.all([
      this.contentDraftModel.findOne({ _id: body.contentDraftId, userId }).lean({ virtuals: true }).exec(),
      this.operatorConfigService.get(userId),
    ])

    if (!draft) {
      throw new NotFoundException('Content draft not found')
    }

    const asset = await this.generatedAssetModel.findOne({ _id: draft.generatedAssetId, userId }).lean({ virtuals: true }).exec()
    if (!asset || asset.reviewStatus !== 'approved') {
      throw new UnprocessableEntityException('Paid packages require an approved asset')
    }

    const title = body.title || draft.paidTitle
    const teaserText = body.teaserText || draft.paidHook || title
    const paidBody = body.body || draft.paidBody
    const destinationUrl = body.destinationUrl || config.fanvueBaseUrl

    if (!title || !paidBody) {
      throw new UnprocessableEntityException('Paid packages require title and body copy')
    }

    await this.contentDraftModel.findByIdAndUpdate(draft.id, { $set: { status: 'ready' } }).exec()

    return await this.paidOfferPackageModel.findOneAndUpdate(
      { userId, contentDraftId: draft.id },
      {
        $set: {
          userId,
          contentDraftId: draft.id,
          paidChannel: 'fanvue',
          title,
          teaserText,
          body: paidBody,
          destinationUrl: destinationUrl || null,
          assetRefs: [
            {
              assetId: asset.assetId,
              previewUrl: asset.previewUrl,
            },
          ],
          checklist: body.checklist.length > 0 ? body.checklist : buildDefaultPaidOfferChecklist(),
          status: 'prepared',
          exportedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean({ virtuals: true }).exec()
  }

  async recordFunnelMetrics(userId: string, body: CreateStudioFunnelMetricsRequest) {
    const [publicPackage, paidPackage] = await Promise.all([
      this.publicPostPackageModel.findOne({ _id: body.publicPostPackageId, userId }).lean({ virtuals: true }).exec(),
      this.paidOfferPackageModel.findOne({ _id: body.paidOfferPackageId, userId }).lean({ virtuals: true }).exec(),
    ])

    if (!publicPackage) {
      throw new NotFoundException('Public post package not found')
    }
    if (!paidPackage) {
      throw new NotFoundException('Paid offer package not found')
    }

    await Promise.all([
      this.publicPostPackageModel.findByIdAndUpdate(publicPackage.id, { $set: { status: 'posted' } }).exec(),
      this.paidOfferPackageModel.findByIdAndUpdate(paidPackage.id, { $set: { status: 'delivered' } }).exec(),
    ])

    return await this.funnelMetricsModel.findOneAndUpdate(
      { userId, publicPostPackageId: publicPackage.id, paidOfferPackageId: paidPackage.id },
      {
        $set: {
          userId,
          publicPostPackageId: publicPackage.id,
          paidOfferPackageId: paidPackage.id,
          publicPostUrl: body.publicPostUrl || null,
          recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
          publicMetrics: body.publicMetrics,
          paidMetrics: body.paidMetrics,
          operatorMemo: body.operatorMemo,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean({ virtuals: true }).exec()
  }

  async getInsights(userId: string) {
    const [items, pendingPublicPostPackages, pendingPaidOfferPackages] = await Promise.all([
      this.funnelMetricsModel.find({ userId }).sort({ recordedAt: -1 }).lean({ virtuals: true }).exec(),
      this.publicPostPackageModel.find({ userId, status: 'prepared' }).sort({ exportedAt: -1 }).lean({ virtuals: true }).exec(),
      this.paidOfferPackageModel.find({ userId, status: 'prepared' }).sort({ exportedAt: -1 }).lean({ virtuals: true }).exec(),
    ])

    const summary = items.reduce((acc, item) => {
      acc.totalPublicPosts += 1
      acc.totalImpressions += item.publicMetrics.impressions
      acc.totalLikes += item.publicMetrics.likes
      acc.totalReposts += item.publicMetrics.reposts
      acc.totalReplies += item.publicMetrics.replies
      acc.totalBookmarks += item.publicMetrics.bookmarks
      acc.totalProfileVisits += item.publicMetrics.profileVisits
      acc.totalLinkClicks += item.publicMetrics.linkClicks
      acc.totalLandingVisits += item.paidMetrics.landingVisits
      acc.totalSubscriberConversions += item.paidMetrics.subscriberConversions
      acc.totalRenewals += item.paidMetrics.renewals
      acc.totalRevenue += item.paidMetrics.revenue
      return acc
    }, {
      totalPublicPosts: 0,
      totalImpressions: 0,
      totalLikes: 0,
      totalReposts: 0,
      totalReplies: 0,
      totalBookmarks: 0,
      totalProfileVisits: 0,
      totalLinkClicks: 0,
      totalLandingVisits: 0,
      totalSubscriberConversions: 0,
      totalRenewals: 0,
      totalRevenue: 0,
    })

    return {
      summary,
      items,
      pendingPublicPostPackages,
      pendingPaidOfferPackages,
    }
  }

  private async buildDraftDefaults(userId: string, generationRunId: string) {
    const [run, config] = await Promise.all([
      this.generationRunModel.findOne({ _id: generationRunId, userId }).lean({ virtuals: true }).exec(),
      this.operatorConfigService.get(userId),
    ])

    if (!run) {
      return {
        publicCaptionOptions: ['Add a teaser caption for the public post here.'],
        publicHashtags: config.defaultPublicHashtags,
        publicCtaLabel: config.defaultCtaLabel,
        publicCtaUrl: config.defaultCtaUrl,
        paidTitle: 'Fanvue drop',
        paidHook: 'Full set ready for paying subscribers.',
        paidBody: 'Add the paid-side description here.',
      }
    }

    const [character, template] = await Promise.all([
      this.characterModel.findOne({ _id: run.characterId, userId }).lean({ virtuals: true }).exec(),
      this.templateModel.findOne({ _id: run.templateId, userId }).lean({ virtuals: true }).exec(),
    ])

    const displayName = character?.displayName || 'Studio Character'
    const scene = template?.scene || 'daily scene'
    const intent = template?.intent || 'quiet confidence'

    return {
      publicCaptionOptions: [
        `${displayName} in ${scene}. ${intent}.`,
        `${scene} with ${displayName}, tuned for a safe public teaser.`,
        `${displayName} with a quieter public cut. Full route stays in the CTA.`,
      ],
      publicHashtags: [
        ...config.defaultPublicHashtags,
        normalizeHashtag(displayName),
        normalizeHashtag(scene),
      ].filter(Boolean),
      publicCtaLabel: config.defaultCtaLabel,
      publicCtaUrl: config.defaultCtaUrl,
      paidTitle: `${displayName} | ${scene}`,
      paidHook: `${intent}. Full set prepared for Fanvue.`,
      paidBody: [
        `${displayName} in ${scene}.`,
        `Angle: ${intent}.`,
        'Use this package as the paid-side offer body and final delivery notes.',
      ].join('\n'),
    }
  }
}
