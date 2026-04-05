import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Schema as MongooseSchema } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'ai_beauty_character' })
export class AiBeautyCharacter extends WithTimestampSchema {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({ required: true, index: true })
  code: string

  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  nationality: string

  @Prop({ required: true })
  age: number

  @Prop({ required: true })
  profession: string

  @Prop({ type: [String], default: [] })
  outfits: string[]

  @Prop({ type: [String], default: [] })
  chiralism_fetish: string[]

  @Prop({ required: true })
  personality: string

  @Prop({ required: true })
  tier_target: string

  @Prop({ required: true, default: 1 })
  status: number
}

export const AiBeautyCharacterSchema = SchemaFactory.createForClass(AiBeautyCharacter)
AiBeautyCharacterSchema.index({ code: 1 }, { unique: true })
