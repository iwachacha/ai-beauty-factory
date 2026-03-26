import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'factoryPostSnapshot' })
export class FactoryPostSnapshot extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: true, index: true })
  publishRecordId: string

  @Prop({ required: true, index: true })
  flowId: string

  @Prop({ required: true })
  accountId: string

  @Prop({ required: true })
  platform: string

  @Prop({ required: false })
  remotePostId?: string

  @Prop({ required: false })
  workLink?: string

  @Prop({ type: Number, required: false, default: null })
  impressions?: number | null

  @Prop({ type: Number, required: false, default: null })
  views?: number | null

  @Prop({ type: Number, required: false, default: null })
  likes?: number | null

  @Prop({ type: Number, required: false, default: null })
  comments?: number | null

  @Prop({ type: Number, required: false, default: null })
  shares?: number | null

  @Prop({ type: Date, required: true, index: true })
  snapshotAt: Date
}

export const FactoryPostSnapshotSchema = SchemaFactory.createForClass(FactoryPostSnapshot)
FactoryPostSnapshotSchema.index({ publishRecordId: 1, snapshotAt: -1 })
