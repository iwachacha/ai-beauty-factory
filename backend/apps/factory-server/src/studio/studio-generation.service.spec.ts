import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PromptComposerService } from './prompt-composer.service'
import { StudioGenerationService } from './studio-generation.service'

vi.mock('@yikart/mongodb', () => ({
  DEFAULT_SCHEMA_OPTIONS: {},
  WithTimestampSchema: class {},
}))

describe('studioGenerationService', () => {
  type StudioGenerationDependencies = ConstructorParameters<typeof StudioGenerationService>

  const characterModel = {
    findOne: vi.fn(),
  }
  const templateModel = {
    findOne: vi.fn(),
  }
  const runModel = {
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  }
  const assetModel = {
    insertMany: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  }
  const provider = {
    generate: vi.fn(),
  }

  let service: StudioGenerationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new StudioGenerationService(
      characterModel as unknown as StudioGenerationDependencies[0],
      templateModel as unknown as StudioGenerationDependencies[1],
      runModel as unknown as StudioGenerationDependencies[2],
      assetModel as unknown as StudioGenerationDependencies[3],
      new PromptComposerService(),
      provider as unknown as StudioGenerationDependencies[5],
    )
  })

  it('creates completed run and pending assets', async () => {
    characterModel.findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
        id: 'char-1',
        faceReferenceAssetIds: ['face-1'],
        displayName: 'Yuna',
        personaSummary: 'gentle office worker',
        nationality: 'JP',
        profession: 'Engineer',
        styleNotes: [],
      }) }),
    })
    templateModel.findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
        id: 'tpl-1',
        scene: 'office desk',
        intent: 'quiet confidence',
        outfitTags: [],
        fetishTags: [],
        negativeBlocks: [],
      }) }),
    })
    runModel.create.mockResolvedValue({ _id: 'run-1' })
    runModel.findByIdAndUpdate
      .mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ startedAt: new Date('2026-04-06T00:00:00.000Z') }) }) })
      .mockReturnValueOnce({ exec: () => Promise.resolve(true) })
    provider.generate.mockResolvedValue({
      providerJobId: 'job-1',
      images: [{ assetId: 'job-1:image.png', previewUrl: 'https://example.com/image.png' }],
    })
    runModel.findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
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
          characterSummary: 'Yuna',
          templateSummary: 'office desk',
        },
        parameterSnapshot: {
          seed: 1,
          model: 'aniverse_v30.safetensors',
          width: 1024,
          height: 1536,
          workflowVersion: 'studio-v1',
          faceReferenceAssetIds: ['face-1'],
          serverAddress: '127.0.0.1:8188',
        },
        status: 'completed',
        error: null,
        providerJobId: 'job-1',
        startedAt: '2026-04-06T00:00:00.000Z',
        completedAt: '2026-04-06T00:00:10.000Z',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:10.000Z',
      }) }),
    })
    assetModel.find.mockReturnValue({
      sort: () => ({ lean: () => ({ exec: () => Promise.resolve([{
        id: 'asset-record-1',
        userId: 'user-1',
        generationRunId: 'run-1',
        assetId: 'job-1:image.png',
        previewUrl: 'https://example.com/image.png',
        reviewStatus: 'pending_review',
        reviewScore: null,
        rejectionReasons: [],
        operatorNote: '',
        qualityChecks: [],
        createdAt: '2026-04-06T00:00:10.000Z',
        updatedAt: '2026-04-06T00:00:10.000Z',
      }]) }) }),
    })

    const result = await service.createRun('user-1', {
      characterId: 'char-1',
      templateId: 'tpl-1',
      targetPlatform: 'x',
      targetTier: 'free_sns',
    })

    expect(provider.generate).toHaveBeenCalledTimes(1)
    expect(assetModel.insertMany).toHaveBeenCalledTimes(1)
    expect(result.assets).toHaveLength(1)
  })

  it('stores failed status when provider errors', async () => {
    characterModel.findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
        id: 'char-1',
        faceReferenceAssetIds: [],
        displayName: 'Yuna',
        personaSummary: 'gentle office worker',
        nationality: 'JP',
        profession: 'Engineer',
        styleNotes: [],
      }) }),
    })
    templateModel.findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
        id: 'tpl-1',
        scene: 'office desk',
        intent: 'quiet confidence',
        outfitTags: [],
        fetishTags: [],
        negativeBlocks: [],
      }) }),
    })
    runModel.create.mockResolvedValue({ _id: 'run-1' })
    runModel.findByIdAndUpdate
      .mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ startedAt: new Date() }) }) })
      .mockReturnValueOnce({ exec: () => Promise.resolve(true) })
    provider.generate.mockRejectedValue(new Error('queue failed'))
    runModel.findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({
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
          characterSummary: 'Yuna',
          templateSummary: 'office desk',
        },
        parameterSnapshot: {
          seed: 1,
          model: 'aniverse_v30.safetensors',
          width: 1024,
          height: 1536,
          workflowVersion: 'studio-v1',
          faceReferenceAssetIds: [],
          serverAddress: '127.0.0.1:8188',
        },
        status: 'failed',
        error: 'queue failed',
        providerJobId: null,
        startedAt: null,
        completedAt: null,
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:10.000Z',
      }) }),
    })
    assetModel.find.mockReturnValue({
      sort: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }),
    })

    const result = await service.createRun('user-1', {
      characterId: 'char-1',
      templateId: 'tpl-1',
      targetPlatform: 'x',
      targetTier: 'free_sns',
    })

    expect(result.run.status).toBe('failed')
    expect(assetModel.insertMany).not.toHaveBeenCalled()
  })
})
