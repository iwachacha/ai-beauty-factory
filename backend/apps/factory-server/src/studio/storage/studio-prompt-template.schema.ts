import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_prompt_template' })
export class StudioPromptTemplateEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  code: string

  @Prop({ required: true, type: String })
  scene: string

  @Prop({ required: true, type: String })
  intent: string

  @Prop({ required: true, type: [String], default: [] })
  outfitTags: string[]

  @Prop({ required: true, type: [String], default: [] })
  fetishTags: string[]

  @Prop({ required: true, type: [String], default: ['free_sns'] })
  tierSuitability: ('free_sns' | 'subscriber' | 'premium')[]

  @Prop({ required: true, type: [String], default: [] })
  positiveBlocks: string[]

  @Prop({ required: true, type: [String], default: [] })
  negativeBlocks: string[]

  @Prop({ required: true, type: String, default: 'active' })
  status: 'draft' | 'active' | 'archived'
}

export const StudioPromptTemplateSchema = SchemaFactory.createForClass(StudioPromptTemplateEntity)
StudioPromptTemplateSchema.index({ userId: 1, code: 1 }, { unique: true })
