import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_operator_config' })
export class StudioOperatorConfigEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, default: 'x' })
  publicChannel: 'x'

  @Prop({ required: true, type: String, default: 'fanvue' })
  paidChannel: 'fanvue'

  @Prop({ required: true, type: String, default: 'See the full set' })
  defaultCtaLabel: string

  @Prop({ required: true, type: String, default: 'https://fanvue.com' })
  defaultCtaUrl: string

  @Prop({ required: true, type: [String], default: ['#AIBeauty'] })
  defaultPublicHashtags: string[]

  @Prop({ required: true, type: [String], default: [] })
  defaultPublicChecklist: string[]

  @Prop({ required: true, type: [String], default: [] })
  defaultPaidChecklist: string[]

  @Prop({ required: true, type: [String], default: [] })
  publicGuidelines: string[]

  @Prop({ required: true, type: [String], default: [] })
  paidGuidelines: string[]

  @Prop({ required: false, type: String, default: '' })
  fanvueCreatorName: string

  @Prop({ required: false, type: String, default: null })
  fanvueBaseUrl: string | null
}

export const StudioOperatorConfigSchema = SchemaFactory.createForClass(StudioOperatorConfigEntity)
StudioOperatorConfigSchema.index({ userId: 1 }, { unique: true })
