import type { CreateStudioCharacterRequest } from './studio.contracts'
import { Injectable, UnprocessableEntityException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { StudioCharacterProfileEntity } from './storage/studio-character-profile.schema'

@Injectable()
export class StudioCharactersService {
  constructor(
    @InjectModel(StudioCharacterProfileEntity.name)
    private readonly characterModel: Model<StudioCharacterProfileEntity>,
  ) {}

  async list(userId: string) {
    return await this.characterModel.find({ userId }).sort({ createdAt: -1 }).lean({ virtuals: true }).exec()
  }

  async save(userId: string, body: CreateStudioCharacterRequest) {
    const payload = {
      userId,
      code: body.code,
      displayName: body.displayName,
      personaSummary: body.personaSummary,
      nationality: body.nationality,
      profession: body.profession,
      styleNotes: body.styleNotes,
      defaultTier: body.defaultTier,
      faceReferenceAssetIds: body.faceReferenceAssetIds,
      status: body.status,
    }

    try {
      return await this.characterModel.findOneAndUpdate(
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
