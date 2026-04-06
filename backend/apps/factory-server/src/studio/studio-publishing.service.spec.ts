import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StudioPublishingService } from './studio-publishing.service'

vi.mock('@yikart/mongodb', () => ({
  DEFAULT_SCHEMA_OPTIONS: {},
  WithTimestampSchema: class {},
}))

vi.mock('./studio-channel-account.service', () => ({
  StudioChannelAccountService: class {},
}))

describe('studioPublishingService', () => {
  const generatedAssetModel = {
    findOne: vi.fn(),
  }
  const contentDraftModel = {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  }
  const publishPackageModel = {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  }
  const publishedPostModel = {
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
  const channelAccountService = {
    getActive: vi.fn(),
  }

  let service: StudioPublishingService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new StudioPublishingService(
      generatedAssetModel as any,
      contentDraftModel as any,
      publishPackageModel as any,
      publishedPostModel as any,
      generationRunModel as any,
      characterModel as any,
      templateModel as any,
      channelAccountService as any,
    )
  })

  it('refuses to create a draft for non-approved assets', async () => {
    generatedAssetModel.findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
        id: 'asset-1',
        reviewStatus: 'pending_review',
      }) }),
    })

    await expect(service.createDraft('user-1', {
      generatedAssetId: 'asset-1',
      captionOptions: [],
      hashtags: [],
      cta: '',
      publishNote: '',
      status: 'draft',
    })).rejects.toThrow('Only approved assets can become drafts')
  })

  it('creates publish packages only for approved assets and active accounts', async () => {
    contentDraftModel.findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
        id: 'draft-1',
        generatedAssetId: 'asset-1',
        captionOptions: ['caption'],
      }) }),
    })
    channelAccountService.getActive.mockResolvedValue({ id: 'channel-1' })
    generatedAssetModel.findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
        id: 'asset-1',
        assetId: 'provider-asset',
        previewUrl: 'https://example.com/image.png',
        reviewStatus: 'approved',
      }) }),
    })
    contentDraftModel.findByIdAndUpdate.mockReturnValue({
      exec: () => Promise.resolve(true),
    })
    publishPackageModel.findOneAndUpdate.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
        id: 'package-1',
        contentDraftId: 'draft-1',
        channelAccountId: 'channel-1',
        finalCaption: 'caption',
        assetRefs: [{ assetId: 'provider-asset', previewUrl: 'https://example.com/image.png' }],
        checklist: [],
        status: 'prepared',
        exportedAt: '2026-04-06T00:00:00.000Z',
      }) }),
    })

    const result = await service.createPublishPackage('user-1', {
      contentDraftId: 'draft-1',
      finalCaption: '',
      checklist: [],
    })

    expect(result?.channelAccountId).toBe('channel-1')
    expect(contentDraftModel.findByIdAndUpdate).toHaveBeenCalled()
  })

  it('aggregates manual metrics for insights', async () => {
    publishedPostModel.find.mockReturnValue({
      sort: () => ({ lean: () => ({ exec: () => Promise.resolve([{
        manualMetrics: {
          impressions: 100,
          likes: 10,
          reposts: 1,
          replies: 2,
          bookmarks: 3,
          profileVisits: 4,
          linkClicks: 5,
        },
      }]) }) }),
    })
    publishPackageModel.find.mockReturnValue({
      sort: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }),
    })

    const result = await service.getInsights('user-1')

    expect(result.summary.totalImpressions).toBe(100)
    expect(result.summary.totalLinkClicks).toBe(5)
  })
})
