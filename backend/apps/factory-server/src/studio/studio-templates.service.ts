import type { CreateStudioTemplateRequest } from './studio.contracts'
import { Injectable, UnprocessableEntityException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { StudioPromptTemplateEntity } from './storage/studio-prompt-template.schema'

@Injectable()
export class StudioTemplatesService {
  constructor(
    @InjectModel(StudioPromptTemplateEntity.name)
    private readonly templateModel: Model<StudioPromptTemplateEntity>,
  ) {}

  async list(userId: string) {
    return await this.templateModel.find({ userId }).sort({ createdAt: -1 }).lean({ virtuals: true }).exec()
  }

  async save(userId: string, body: CreateStudioTemplateRequest) {
    const payload = {
      userId,
      code: body.code,
      scene: body.scene,
      intent: body.intent,
      outfitTags: body.outfitTags,
      fetishTags: body.fetishTags,
      tierSuitability: body.tierSuitability,
      positiveBlocks: body.positiveBlocks,
      negativeBlocks: body.negativeBlocks,
      status: body.status,
    }

    try {
      return await this.templateModel.findOneAndUpdate(
        { userId, code: body.code },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean({ virtuals: true }).exec()
    }
    catch (error) {
      throw new UnprocessableEntityException((error as Error).message)
    }
  }
}
