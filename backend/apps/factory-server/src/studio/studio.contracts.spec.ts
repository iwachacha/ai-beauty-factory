import { describe, expect, it } from 'vitest'
import {
  studioChannelAccountStateSchema,
  studioCharacterProfileSchema,
  studioGenerationRunDetailSchema,
  studioInsightsResponseSchema,
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

  it('parses generation run details', () => {
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
        reviewScore: null,
        rejectionReasons: [],
        operatorNote: '',
        qualityChecks: [{
          code: 'face_consistency',
          label: '顔の一貫性',
          status: 'manual_review_required',
          detail: null,
        }],
        createdAt: '2026-04-06T00:00:10.000Z',
        updatedAt: '2026-04-06T00:00:10.000Z',
      }],
    })

    expect(parsed.assets).toHaveLength(1)
  })

  it('parses insights fixtures', () => {
    const parsed = studioInsightsResponseSchema.parse({
      summary: {
        totalPosts: 1,
        totalImpressions: 100,
        totalLikes: 20,
        totalReposts: 3,
        totalReplies: 4,
        totalBookmarks: 5,
        totalProfileVisits: 6,
        totalLinkClicks: 7,
      },
      items: [{
        id: 'post-1',
        userId: 'user-1',
        publishPackageId: 'package-1',
        platformPostUrl: 'https://x.com/test/status/1',
        publishedAt: '2026-04-06T00:00:00.000Z',
        manualMetrics: {
          impressions: 100,
          likes: 20,
          reposts: 3,
          replies: 4,
          bookmarks: 5,
          profileVisits: 6,
          linkClicks: 7,
        },
        operatorMemo: '',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z',
      }],
      pendingPublishPackages: [],
    })

    expect(parsed.summary.totalLikes).toBe(20)
  })
})
