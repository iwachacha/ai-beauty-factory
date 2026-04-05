import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'
import mongoose from 'mongoose'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'factoryFlow' })
export class FactoryFlow extends WithTimestampSchema {
  id: string

  @Prop({ type: String, required: true, index: true })
  userId: string

  @Prop({ type: String, required: true })
  name: string

  @Prop({ type: String, required: true, index: true })
  contentAssetId: string

  @Prop({ type: [String], default: [] })
  targetAccountIds: string[]

  @Prop({ type: Date, required: false })
  scheduleAt?: Date

  @Prop({ type: String, required: true, default: 'draft' })
  status: string

  @Prop({ type: Date, required: false })
  lastEnqueuedAt?: Date

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  platformOptions: Record<string, Record<string, unknown>>
}

export const FactoryFlowSchema = SchemaFactory.createForClass(FactoryFlow)
FactoryFlowSchema.index({ userId: 1, createdAt: -1 })
