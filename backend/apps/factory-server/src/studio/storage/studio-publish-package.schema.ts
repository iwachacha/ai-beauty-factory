import type { StudioAssetRef } from '../studio.contracts'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_publish_package' })
export class StudioPublishPackageEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  contentDraftId: string

  @Prop({ required: true, type: String, index: true })
  channelAccountId: string

  @Prop({ required: true, type: String })
  finalCaption: string

  @Prop({ required: true, type: [Object], default: [] })
  assetRefs: StudioAssetRef[]

  @Prop({ required: true, type: [String], default: [] })
  checklist: string[]

  @Prop({ required: true, type: String, default: 'prepared' })
  status: 'prepared' | 'published'

  @Prop({ required: true, type: Date })
  exportedAt: Date
}

export const StudioPublishPackageSchema = SchemaFactory.createForClass(StudioPublishPackageEntity)
StudioPublishPackageSchema.index({ userId: 1, contentDraftId: 1 }, { unique: true })
