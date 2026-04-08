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
  publicCaptionOptions: string[]

  @Prop({ required: true, type: [String], default: [] })
  publicHashtags: string[]

  @Prop({ required: false, type: String, default: '' })
  publicCtaLabel: string

  @Prop({ required: false, type: String, default: 'https://fanvue.com' })
  publicCtaUrl: string

  @Prop({ required: false, type: String, default: '' })
  publicPostNote: string

  @Prop({ required: false, type: String, default: '' })
  paidTitle: string

  @Prop({ required: false, type: String, default: '' })
  paidHook: string

  @Prop({ required: false, type: String, default: '' })
  paidBody: string

  @Prop({ required: false, type: String, default: '' })
  paidOfferNote: string

  @Prop({ required: true, type: String, default: 'draft', index: true })
  status: 'draft' | 'ready'
}

export const StudioContentDraftSchema = SchemaFactory.createForClass(StudioContentDraftEntity)
StudioContentDraftSchema.index({ userId: 1, generatedAssetId: 1 }, { unique: true })
