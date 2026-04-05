import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Schema as MongooseSchema } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'ai_beauty_monetization' })
export class AiBeautyMonetization extends WithTimestampSchema {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({ required: true, type: Date, index: true })
  recordDate: Date

  @Prop({ required: true })
  platform: string

  @Prop({ required: true, default: 0 })
  newSubscribers: number

  @Prop({ required: true, default: 0 })
  revenueEarned: number

  @Prop({ required: true, default: 'USD' })
  currency: string
}

export const AiBeautyMonetizationSchema = SchemaFactory.createForClass(AiBeautyMonetization)
AiBeautyMonetizationSchema.index({ recordDate: 1, platform: 1 }, { unique: true })
