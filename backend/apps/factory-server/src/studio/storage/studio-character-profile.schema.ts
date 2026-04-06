import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_character_profile' })
export class StudioCharacterProfileEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  code: string

  @Prop({ required: true, type: String })
  displayName: string

  @Prop({ required: true, type: String })
  personaSummary: string

  @Prop({ required: true, type: String })
  nationality: string

  @Prop({ required: true, type: String })
  profession: string

  @Prop({ required: true, type: [String], default: [] })
  styleNotes: string[]

  @Prop({ required: true, type: String, default: 'free_sns' })
  defaultTier: 'free_sns' | 'subscriber' | 'premium'

  @Prop({ required: true, type: [String], default: [] })
  faceReferenceAssetIds: string[]

  @Prop({ required: true, type: String, default: 'active' })
  status: 'draft' | 'active' | 'archived'
}

export const StudioCharacterProfileSchema = SchemaFactory.createForClass(StudioCharacterProfileEntity)
StudioCharacterProfileSchema.index({ userId: 1, code: 1 }, { unique: true })
