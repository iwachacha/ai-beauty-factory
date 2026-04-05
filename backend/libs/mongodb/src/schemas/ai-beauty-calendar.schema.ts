import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Schema as MongooseSchema } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'ai_beauty_calendar' })
export class AiBeautyCalendar extends WithTimestampSchema {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({ required: true, index: true })
  characterCode: string

  @Prop({ required: true, type: Date })
  scheduledDate: Date

  @Prop({ required: false })
  templateId?: string

  @Prop({ required: true })
  platform: string

  @Prop({ required: false })
  mediaUrl?: string

  @Prop({ required: true, default: 'pending' })
  status: string
}

export const AiBeautyCalendarSchema = SchemaFactory.createForClass(AiBeautyCalendar)
