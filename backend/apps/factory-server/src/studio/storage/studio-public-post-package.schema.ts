import type { StudioAssetRef } from '../studio.contracts'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_public_post_package' })
export class StudioPublicPostPackageEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  contentDraftId: string

  @Prop({ required: true, type: String, index: true })
  channelAccountId: string

  @Prop({ required: true, type: String, default: 'x' })
  publicChannel: 'x'

  @Prop({ required: true, type: String })
  finalCaption: string

  @Prop({ required: true, type: [String], default: [] })
  hashtags: string[]

  @Prop({ required: true, type: String })
  ctaLabel: string

  @Prop({ required: true, type: String })
  ctaUrl: string

  @Prop({ required: true, type: [Object], default: [] })
  assetRefs: StudioAssetRef[]

  @Prop({ required: true, type: [String], default: [] })
  checklist: string[]

  @Prop({ required: true, type: String, default: 'prepared' })
  status: 'prepared' | 'posted'

  @Prop({ required: true, type: Date })
  exportedAt: Date
}

export const StudioPublicPostPackageSchema = SchemaFactory.createForClass(StudioPublicPostPackageEntity)
StudioPublicPostPackageSchema.index({ userId: 1, contentDraftId: 1 }, { unique: true })
