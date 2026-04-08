import { describe, expect, it } from 'vitest'
import {
  createStudioOperatorConfigRequestSchema,
  reviewStudioGeneratedAssetRequestSchema,
  studioChannelAccountStateSchema,
  studioCharacterProfileSchema,
  studioGenerationRunDetailSchema,
  studioInsightsResponseSchema,
  studioOperatorConfigSchema,
  studioPromptTemplateSchema,
} from './studio.contracts'

describe('studio.contracts', () => {
  it('parses character fixtures', () => {
    const parsed = studioCharacterProfileSchema.parse({
      id: 'char-1',
      userId: 'user-1',
      code: 'yuna',
      displayName: 'Yuna',
      personaSummary: 'Soft office persona',
      nationality: 'JP',
      profession: 'Engineer',
      styleNotes: ['soft smile'],
      defaultTier: 'free_sns',
      faceReferenceAssetIds: ['asset-1'],
      status: 'active',
      createdAt: '2026-04-06T00:00:00.000Z',
      updatedAt: '2026-04-06T00:00:00.000Z',
    })

    expect(parsed.code).toBe('yuna')
  })

  it('parses template fixtures', () => {
    const parsed = studioPromptTemplateSchema.parse({
      id: 'tpl-1',
      userId: 'user-1',
      code: 'office-soft',
      scene: 'office desk',
      intent: 'quiet confidence',
      outfitTags: ['office wear'],
      fetishTags: ['pantyhose'],
      tierSuitability: ['free_sns'],
      positiveBlocks: ['natural light'],
      negativeBlocks: ['blurry'],
      status: 'active',
      createdAt: '2026-04-06T00:00:00.000Z',
      updatedAt: '2026-04-06T00:00:00.000Z',
    })

    expect(parsed.tierSuitability).toEqual(['free_sns'])
  })

  it('parses operator config fixtures', () => {
    const parsed = studioOperatorConfigSchema.parse({
      id: 'config-1',
      userId: 'user-1',
      publicChannel: 'x',
      paidChannel: 'fanvue',
      defaultCtaLabel: 'See the full set',
      defaultCtaUrl: 'https://fanvue.com/yuna',
      defaultPublicHashtags: ['#AIBeauty'],
      defaultPublicChecklist: ['Keep the teaser public-safe.'],
      defaultPaidChecklist: ['Verify the Fanvue destination.'],
      publicGuidelines: ['No explicit nudity on X.'],
      paidGuidelines: ['Reserve stronger cuts for paid only.'],
      fanvueCreatorName: 'Yuna',
      fanvueBaseUrl: 'https://fanvue.com/yuna',
      createdAt: '2026-04-06T00:00:00.000Z',
      updatedAt: '2026-04-06T00:00:00.000Z',
    })

    expect(parsed.paidChannel).toBe('fanvue')
  })

  it('parses channel account state fixtures', () => {
    const parsed = studioChannelAccountStateSchema.parse({
      activeAccountId: 'account-1',
      items: [{
        id: 'studio-account-1',
        userId: 'user-1',
        accountId: 'account-1',
        platform: 'x',
        status: 'connected',
        isActive: true,
        credentialSummary: {
          nickname: 'Yuna Daily',
          handle: 'yuna_daily',
          followers: 1200,
          profileUrl: 'https://x.com/yuna_daily',
          lastSyncedAt: '2026-04-06T00:00:00.000Z',
        },
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z',
      }],
      availableAccounts: [{
        accountId: 'account-1',
        platform: 'x',
        nickname: 'Yuna Daily',
        handle: 'yuna_daily',
        followers: 1200,
        status: 1,
      }],
    })

    expect(parsed.activeAccountId).toBe('account-1')
  })

  it('parses generation run details with unrouted pending assets', () => {
    const parsed = studioGenerationRunDetailSchema.parse({
      run: {
        id: 'run-1',
        userId: 'user-1',
        characterId: 'char-1',
        templateId: 'tpl-1',
        targetPlatform: 'x',
        targetTier: 'free_sns',
        workflowVersion: 'studio-v1',
        promptSnapshot: {
          positivePrompt: 'prompt',
          negativePrompt: 'negative',
          positiveBlocks: ['prompt'],
          negativeBlocks: ['negative'],
          characterSummary: 'char',
          templateSummary: 'template',
        },
        parameterSnapshot: {
          seed: 1234,
          model: 'aniverse_v30.safetensors',
          width: 1024,
          height: 1536,
          workflowVersion: 'studio-v1',
          faceReferenceAssetIds: ['asset-1'],
          serverAddress: '127.0.0.1:8188',
        },
        status: 'completed',
        error: null,
        providerJobId: 'job-1',
        startedAt: '2026-04-06T00:00:00.000Z',
        completedAt: '2026-04-06T00:00:10.000Z',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:10.000Z',
      },
      assets: [{
        id: 'asset-record-1',
        userId: 'user-1',
        generationRunId: 'run-1',
        assetId: 'job-1:image.png',
        previewUrl: 'https://example.com/image.png',
        reviewStatus: 'pending_review',
        surfaceFit: null,
        reviewScore: null,
        rejectionReasons: [],
        operatorNote: '',
        qualityChecks: [{
          code: 'face_consistency',
          label: 'Face consistency',
          status: 'manual_review_required',
          detail: null,
        }],
        createdAt: '2026-04-06T00:00:10.000Z',
        updatedAt: '2026-04-06T00:00:10.000Z',
      }],
    })

    expect(parsed.assets[0]?.surfaceFit).toBeNull()
  })

  it('requires surface fit when approving an asset', () => {
    const result = reviewStudioGeneratedAssetRequestSchema.safeParse({
      decision: 'approve',
      reviewScore: 95,
      rejectionReasons: [],
      operatorNote: 'Looks good',
    })

    expect(result.success).toBe(false)
  })

  it('applies operator config defaults', () => {
    const parsed = createStudioOperatorConfigRequestSchema.parse({})

    expect(parsed.defaultCtaLabel).toBe('See the full set')
    expect(parsed.defaultCtaUrl).toBe('https://fanvue.com')
  })

  it('parses combined public and paid insights fixtures', () => {
    const parsed = studioInsightsResponseSchema.parse({
      summary: {
        totalPublicPosts: 1,
        totalImpressions: 100,
        totalLikes: 20,
        totalReposts: 3,
        totalReplies: 4,
        totalBookmarks: 5,
        totalProfileVisits: 6,
        totalLinkClicks: 7,
        totalLandingVisits: 9,
        totalSubscriberConversions: 2,
        totalRenewals: 1,
        totalRevenue: 39.5,
      },
      items: [{
        id: 'metrics-1',
        userId: 'user-1',
        publicPostPackageId: 'public-1',
        paidOfferPackageId: 'paid-1',
        publicPostUrl: 'https://x.com/test/status/1',
        recordedAt: '2026-04-06T00:00:00.000Z',
        publicMetrics: {
          impressions: 100,
          likes: 20,
          reposts: 3,
          replies: 4,
          bookmarks: 5,
          profileVisits: 6,
          linkClicks: 7,
        },
        paidMetrics: {
          landingVisits: 9,
          subscriberConversions: 2,
          renewals: 1,
          revenue: 39.5,
        },
        operatorMemo: '',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z',
      }],
      pendingPublicPostPackages: [{
        id: 'public-1',
        userId: 'user-1',
        contentDraftId: 'draft-1',
        channelAccountId: 'channel-1',
        publicChannel: 'x',
        finalCaption: 'caption',
        hashtags: ['#AIBeauty'],
        ctaLabel: 'See the full set',
        ctaUrl: 'https://fanvue.com/yuna',
        assetRefs: [{ assetId: 'asset-1', previewUrl: 'https://example.com/image.png' }],
        checklist: ['Confirm crop'],
        status: 'prepared',
        exportedAt: '2026-04-06T00:00:00.000Z',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z',
      }],
      pendingPaidOfferPackages: [{
        id: 'paid-1',
        userId: 'user-1',
        contentDraftId: 'draft-1',
        paidChannel: 'fanvue',
        title: 'Paid drop',
        teaserText: 'Full set inside',
        body: 'Longer paid-side copy',
        destinationUrl: 'https://fanvue.com/yuna',
        assetRefs: [{ assetId: 'asset-1', previewUrl: 'https://example.com/image.png' }],
        checklist: ['Verify destination'],
        status: 'prepared',
        exportedAt: '2026-04-06T00:00:00.000Z',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z',
      }],
    })

    expect(parsed.summary.totalRevenue).toBe(39.5)
    expect(parsed.pendingPaidOfferPackages).toHaveLength(1)
  })
})
