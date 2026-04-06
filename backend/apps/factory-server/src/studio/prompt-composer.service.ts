import type {
  StudioPromptSnapshot,
  StudioTier,
} from './studio.contracts'
import { Injectable } from '@nestjs/common'

interface PromptComposerCharacterInput {
  displayName: string
  personaSummary: string
  nationality: string
  profession: string
  styleNotes: string[]
}

interface PromptComposerTemplateInput {
  scene: string
  intent: string
  outfitTags: string[]
  fetishTags: string[]
  negativeBlocks: string[]
}

@Injectable()
export class PromptComposerService {
  compose(input: {
    character: PromptComposerCharacterInput
    template: PromptComposerTemplateInput
    tier: StudioTier
  }): StudioPromptSnapshot {
    const { character, template, tier } = input
    const positiveBlocks = [
      `${character.displayName}, ${character.nationality}, ${character.profession}`,
      character.personaSummary,
      template.scene,
      template.intent,
      ...character.styleNotes,
      ...template.outfitTags,
      ...template.fetishTags,
      `tier:${tier}`,
      'high resolution photo',
      'natural lighting',
      'realistic skin texture',
    ].filter(Boolean)

    const negativeBlocks = [
      ...template.negativeBlocks,
      'bad anatomy',
      'blurry',
      'artifacts',
      'deformed hands',
      'plastic skin',
    ].filter(Boolean)

    return {
      positivePrompt: positiveBlocks.join(', '),
      negativePrompt: negativeBlocks.join(', '),
      positiveBlocks,
      negativeBlocks,
      characterSummary: `${character.displayName} / ${character.personaSummary}`,
      templateSummary: `${template.scene} / ${template.intent}`,
    }
  }
}
