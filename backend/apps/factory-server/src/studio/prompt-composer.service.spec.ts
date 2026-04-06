import { describe, expect, it } from 'vitest'
import { PromptComposerService } from './prompt-composer.service'

describe('promptComposerService', () => {
  const service = new PromptComposerService()

  it('builds a stable prompt snapshot', () => {
    const snapshot = service.compose({
      character: {
        id: 'char-1',
        userId: 'user-1',
        code: 'yuna',
        displayName: 'Yuna',
        personaSummary: 'gentle office worker',
        nationality: 'JP',
        profession: 'Engineer',
        styleNotes: ['soft smile', 'clean makeup'],
        defaultTier: 'free_sns',
        faceReferenceAssetIds: ['face-1'],
        status: 'active',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z',
      },
      template: {
        id: 'tpl-1',
        userId: 'user-1',
        code: 'office-soft',
        scene: 'office desk',
        intent: 'quiet confidence',
        outfitTags: ['office wear'],
        fetishTags: ['pantyhose'],
        tierSuitability: ['free_sns'],
        positiveBlocks: ['window light'],
        negativeBlocks: ['blurry'],
        status: 'active',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z',
      },
      tier: 'free_sns',
    })

    expect(snapshot.positivePrompt).toContain('Yuna, JP, Engineer')
    expect(snapshot.positivePrompt).toContain('office desk')
    expect(snapshot.positivePrompt).toContain('tier:free_sns')
    expect(snapshot.negativePrompt).toContain('blurry')
    expect(snapshot.negativePrompt).toContain('plastic skin')
  })
})
