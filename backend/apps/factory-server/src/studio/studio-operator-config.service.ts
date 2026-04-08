import type { CreateStudioOperatorConfigRequest } from './studio.contracts'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { StudioOperatorConfigEntity } from './storage/studio-operator-config.schema'
import { normalizeHashtag } from './studio.constants'
import { createStudioOperatorConfigRequestSchema } from './studio.contracts'

@Injectable()
export class StudioOperatorConfigService {
  constructor(
    @InjectModel(StudioOperatorConfigEntity.name)
    private readonly operatorConfigModel: Model<StudioOperatorConfigEntity>,
  ) {}

  async get(userId: string) {
    const existing = await this.operatorConfigModel.findOne({ userId }).lean({ virtuals: true }).exec()
    if (existing) {
      return existing
    }

    const defaults = createStudioOperatorConfigRequestSchema.parse({})
    return await this.save(userId, defaults)
  }

  async save(userId: string, body: CreateStudioOperatorConfigRequest) {
    return await this.operatorConfigModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          publicChannel: 'x',
          paidChannel: 'fanvue',
          defaultCtaLabel: body.defaultCtaLabel,
          defaultCtaUrl: body.defaultCtaUrl,
          defaultPublicHashtags: body.defaultPublicHashtags.map(normalizeHashtag).filter(Boolean),
          defaultPublicChecklist: body.defaultPublicChecklist,
          defaultPaidChecklist: body.defaultPaidChecklist,
          publicGuidelines: body.publicGuidelines,
          paidGuidelines: body.paidGuidelines,
          fanvueCreatorName: body.fanvueCreatorName,
          fanvueBaseUrl: body.fanvueBaseUrl,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean({ virtuals: true }).exec()
  }
}
