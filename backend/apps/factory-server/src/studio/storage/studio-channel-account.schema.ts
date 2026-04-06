import type { StudioCredentialSummary } from '../studio.contracts'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_channel_account' })
export class StudioChannelAccountEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  accountId: string

  @Prop({ required: true, type: String, default: 'x' })
  platform: 'x'

  @Prop({ required: true, type: String, default: 'connected' })
  status: 'connected' | 'needs_reconnect'

  @Prop({ required: true, type: Boolean, default: false, index: true })
  isActive: boolean

  @Prop({ required: true, type: Object })
  credentialSummary: StudioCredentialSummary
}

export const StudioChannelAccountSchema = SchemaFactory.createForClass(StudioChannelAccountEntity)
StudioChannelAccountSchema.index({ userId: 1, accountId: 1 }, { unique: true })
StudioChannelAccountSchema.index({ userId: 1, isActive: 1 })
