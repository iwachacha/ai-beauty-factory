import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Schema as MongooseSchema } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'ai_beauty_template' })
export class AiBeautyTemplate extends WithTimestampSchema {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({ required: true, index: true })
  templateId: string

  @Prop({ required: true })
  category: string

  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  prompt_text: string

  @Prop({ type: [String], default: [] })
  recommended_outfits: string[]

  @Prop({ required: true, default: 1 })
  status: number
}

export const AiBeautyTemplateSchema = SchemaFactory.createForClass(AiBeautyTemplate)
AiBeautyTemplateSchema.index({ templateId: 1 }, { unique: true })
