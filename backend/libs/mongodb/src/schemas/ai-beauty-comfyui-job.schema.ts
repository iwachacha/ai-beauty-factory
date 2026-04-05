import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Schema as MongooseSchema } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'ai_beauty_comfyui_job' })
export class AiBeautyComfyuiJob extends WithTimestampSchema {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({ required: true, index: true })
  jobId: string

  @Prop({ required: true })
  characterCode: string

  @Prop({ required: true })
  promptText: string

  @Prop({ required: true, default: 'queued' })
  status: string

  @Prop({ type: [String], default: [] })
  resultUrls: string[]
}

export const AiBeautyComfyuiJobSchema = SchemaFactory.createForClass(AiBeautyComfyuiJob)
AiBeautyComfyuiJobSchema.index({ jobId: 1 }, { unique: true })
