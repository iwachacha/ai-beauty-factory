import type { StudioManualMetrics } from '../studio.contracts'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_published_post' })
export class StudioPublishedPostEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  publishPackageId: string

  @Prop({ required: true, type: String })
  platformPostUrl: string

  @Prop({ required: true, type: Date })
  publishedAt: Date

  @Prop({ required: true, type: Object })
  manualMetrics: StudioManualMetrics

  @Prop({ required: false, type: String, default: '' })
  operatorMemo: string
}

export const StudioPublishedPostSchema = SchemaFactory.createForClass(StudioPublishedPostEntity)
StudioPublishedPostSchema.index({ userId: 1, publishPackageId: 1 }, { unique: true })
