import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_content_draft' })
export class StudioContentDraftEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  generatedAssetId: string

  @Prop({ required: true, type: [String], default: [] })
  captionOptions: string[]

  @Prop({ required: true, type: [String], default: [] })
  hashtags: string[]

  @Prop({ required: false, type: String, default: '' })
  cta: string

  @Prop({ required: false, type: String, default: '' })
  publishNote: string

  @Prop({ required: true, type: String, default: 'draft', index: true })
  status: 'draft' | 'ready'
}

export const StudioContentDraftSchema = SchemaFactory.createForClass(StudioContentDraftEntity)
StudioContentDraftSchema.index({ userId: 1, generatedAssetId: 1 }, { unique: true })
