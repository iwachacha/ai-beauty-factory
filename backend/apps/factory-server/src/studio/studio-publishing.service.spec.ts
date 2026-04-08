import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StudioPublishingService } from './studio-publishing.service'

vi.mock('@yikart/mongodb', () => ({
  DEFAULT_SCHEMA_OPTIONS: {},
  WithTimestampSchema: class {},
}))

vi.mock('./studio-channel-account.service', () => ({
  StudioChannelAccountService: class {},
}))

vi.mock('./studio-operator-config.service', () => ({
  StudioOperatorConfigService: class {},
}))

function leanResult<T>(value: T) {
  return {
    lean: () => ({
      exec: () => Promise.resolve(value),
    }),
  }
}

function sortedLeanResult<T>(value: T) {
  return {
    sort: () => ({
      lean: () => ({
        exec: () => Promise.resolve(value),
      }),
    }),
  }
}

describe('studioPublishingService', () => {
  type StudioPublishingDependencies = ConstructorParameters<typeof StudioPublishingService>

  const generatedAssetModel = {
    findOne: vi.fn(),
  }
  const contentDraftModel = {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  }
  const publicPostPackageModel = {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  }
  const paidOfferPackageModel = {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  }
  const funnelMetricsModel = {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  }
  const generationRunModel = {
    findOne: vi.fn(),
  }
  const characterModel = {
    findOne: vi.fn(),
  }
  const templateModel = {
    findOne: vi.fn(),
  }
  const operatorConfigService = {
    get: vi.fn(),
  }
  const channelAccountService = {
    getActive: vi.fn(),
  }

  let service: StudioPublishingService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new StudioPublishingService(
      generatedAssetModel as unknown as StudioPublishingDependencies[0],
      contentDraftModel as unknown as StudioPublishingDependencies[1],
      publicPostPackageModel as unknown as StudioPublishingDependencies[2],
      paidOfferPackageModel as unknown as StudioPublishingDependencies[3],
      funnelMetricsModel as unknown as StudioPublishingDependencies[4],
      generationRunModel as unknown as StudioPublishingDependencies[5],
      characterModel as unknown as StudioPublishingDependencies[6],
      templateModel as unknown as StudioPublishingDependencies[7],
      operatorConfigService as unknown as StudioPublishingDependencies[8],
      channelAccountService as unknown as StudioPublishingDependencies[9],
    )
  })

  it('refuses to create a draft for non-approved assets', async () => {
    generatedAssetModel.findOne.mockReturnValue(leanResult({
      id: 'asset-1',
      reviewStatus: 'pending_review',
    }))

    await expect(service.createDraft('user-1', {
      generatedAssetId: 'asset-1',
      publicCaptionOptions: [],
      publicHashtags: [],
      publicCtaLabel: '',
      publicCtaUrl: undefined,
      publicPostNote: '',
      paidTitle: '',
      paidHook: '',
      paidBody: '',
      paidOfferNote: '',
      status: 'draft',
    })).rejects.toThrow('Only approved assets can become drafts')
  })

  it('refuses to create a public package when no active X account exists', async () => {
    contentDraftModel.findOne.mockReturnValue(leanResult({
      id: 'draft-1',
      generatedAssetId: 'asset-1',
      publicCaptionOptions: ['caption'],
      publicHashtags: ['#AIBeauty'],
      publicCtaLabel: 'See the full set',
      publicCtaUrl: 'https://fanvue.com/yuna',
    }))
    channelAccountService.getActive.mockResolvedValue(null)

    await expect(service.createPublicPostPackage('user-1', {
      contentDraftId: 'draft-1',
      finalCaption: '',
      ctaLabel: '',
      ctaUrl: undefined,
      checklist: [],
    })).rejects.toThrow('Activate an X account before exporting a public package')
  })

  it('blocks paid_only assets from public package export', async () => {
    contentDraftModel.findOne.mockReturnValue(leanResult({
      id: 'draft-1',
      generatedAssetId: 'asset-1',
      publicCaptionOptions: ['caption'],
      publicHashtags: ['#AIBeauty'],
      publicCtaLabel: 'See the full set',
      publicCtaUrl: 'https://fanvue.com/yuna',
    }))
    channelAccountService.getActive.mockResolvedValue({ id: 'channel-1' })
    generatedAssetModel.findOne.mockReturnValue(leanResult({
      id: 'asset-1',
      assetId: 'provider-asset',
      previewUrl: 'https://example.com/image.png',
      reviewStatus: 'approved',
      surfaceFit: 'paid_only',
    }))

    await expect(service.createPublicPostPackage('user-1', {
      contentDraftId: 'draft-1',
      finalCaption: '',
      ctaLabel: '',
      ctaUrl: undefined,
      checklist: [],
    })).rejects.toThrow('Only public_safe assets can become public packages')
  })

  it('creates public packages only for approved public_safe assets with an active account', async () => {
    contentDraftModel.findOne.mockReturnValue(leanResult({
      id: 'draft-1',
      generatedAssetId: 'asset-1',
      publicCaptionOptions: ['caption'],
      publicHashtags: ['#AIBeauty'],
      publicCtaLabel: 'See the full set',
      publicCtaUrl: 'https://fanvue.com/yuna',
    }))
    channelAccountService.getActive.mockResolvedValue({ id: 'channel-1' })
    generatedAssetModel.findOne.mockReturnValue(leanResult({
      id: 'asset-1',
      assetId: 'provider-asset',
      previewUrl: 'https://example.com/image.png',
      reviewStatus: 'approved',
      surfaceFit: 'public_safe',
    }))
    contentDraftModel.findByIdAndUpdate.mockReturnValue({
      exec: () => Promise.resolve(true),
    })
    publicPostPackageModel.findOneAndUpdate.mockReturnValue(leanResult({
      id: 'package-1',
      contentDraftId: 'draft-1',
      channelAccountId: 'channel-1',
      publicChannel: 'x',
      finalCaption: 'caption',
      hashtags: ['#AIBeauty'],
      ctaLabel: 'See the full set',
      ctaUrl: 'https://fanvue.com/yuna',
      assetRefs: [{ assetId: 'provider-asset', previewUrl: 'https://example.com/image.png' }],
      checklist: [],
      status: 'prepared',
      exportedAt: '2026-04-06T00:00:00.000Z',
    }))

    const result = await service.createPublicPostPackage('user-1', {
      contentDraftId: 'draft-1',
      finalCaption: '',
      ctaLabel: '',
      ctaUrl: undefined,
      checklist: [],
    })

    expect(result?.channelAccountId).toBe('channel-1')
    expect(result?.publicChannel).toBe('x')
    expect(contentDraftModel.findByIdAndUpdate).toHaveBeenCalled()
  })

  it('falls back to the operator Fanvue destination when creating a paid package', async () => {
    contentDraftModel.findOne.mockReturnValue(leanResult({
      id: 'draft-1',
      generatedAssetId: 'asset-1',
      paidTitle: 'Paid drop',
      paidHook: 'Full set inside',
      paidBody: 'Long paid-side copy',
    }))
    operatorConfigService.get.mockResolvedValue({
      fanvueBaseUrl: 'https://fanvue.com/yuna',
    })
    generatedAssetModel.findOne.mockReturnValue(leanResult({
      id: 'asset-1',
      assetId: 'provider-asset',
      previewUrl: 'https://example.com/image.png',
      reviewStatus: 'approved',
      surfaceFit: 'paid_only',
    }))
    contentDraftModel.findByIdAndUpdate.mockReturnValue({
      exec: () => Promise.resolve(true),
    })
    paidOfferPackageModel.findOneAndUpdate.mockReturnValue(leanResult({
      id: 'paid-1',
      contentDraftId: 'draft-1',
      paidChannel: 'fanvue',
      title: 'Paid drop',
      teaserText: 'Full set inside',
      body: 'Long paid-side copy',
      destinationUrl: 'https://fanvue.com/yuna',
      assetRefs: [{ assetId: 'provider-asset', previewUrl: 'https://example.com/image.png' }],
      checklist: [],
      status: 'prepared',
      exportedAt: '2026-04-06T00:00:00.000Z',
    }))

    const result = await service.createPaidOfferPackage('user-1', {
      contentDraftId: 'draft-1',
      title: undefined,
      teaserText: undefined,
      body: undefined,
      destinationUrl: undefined,
      checklist: [],
    })

    expect(result?.paidChannel).toBe('fanvue')
    expect(result?.destinationUrl).toBe('https://fanvue.com/yuna')
  })

  it('aggregates public and paid metrics for insights', async () => {
    funnelMetricsModel.find.mockReturnValue(sortedLeanResult([{
      publicMetrics: {
        impressions: 100,
        likes: 10,
        reposts: 1,
        replies: 2,
        bookmarks: 3,
        profileVisits: 4,
        linkClicks: 5,
      },
      paidMetrics: {
        landingVisits: 7,
        subscriberConversions: 2,
        renewals: 1,
        revenue: 29.5,
      },
    }]))
    publicPostPackageModel.find.mockReturnValue(sortedLeanResult([]))
    paidOfferPackageModel.find.mockReturnValue(sortedLeanResult([]))

    const result = await service.getInsights('user-1')

    expect(result.summary.totalImpressions).toBe(100)
    expect(result.summary.totalLinkClicks).toBe(5)
    expect(result.summary.totalLandingVisits).toBe(7)
    expect(result.summary.totalSubscriberConversions).toBe(2)
    expect(result.summary.totalRevenue).toBe(29.5)
  })
})
