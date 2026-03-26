import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'factoryAccountSnapshot' })
export class FactoryAccountSnapshot extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: true, index: true })
  accountId: string

  @Prop({ required: true })
  platform: string

  @Prop({ required: true })
  followers: number

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

  @Prop({ type: Number, required: false, default: null })
  posts?: number | null

  @Prop({ type: Date, required: true, index: true })
  snapshotAt: Date
}

export const FactoryAccountSnapshotSchema = SchemaFactory.createForClass(FactoryAccountSnapshot)
FactoryAccountSnapshotSchema.index({ accountId: 1, snapshotAt: -1 })
