import type { StudioAssetRef } from '../studio.contracts'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_paid_offer_package' })
export class StudioPaidOfferPackageEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  contentDraftId: string

  @Prop({ required: true, type: String, default: 'fanvue' })
  paidChannel: 'fanvue'

  @Prop({ required: true, type: String })
  title: string

  @Prop({ required: true, type: String })
  teaserText: string

  @Prop({ required: true, type: String })
  body: string

  @Prop({ required: false, type: String, default: null })
  destinationUrl: string | null

  @Prop({ required: true, type: [Object], default: [] })
  assetRefs: StudioAssetRef[]

  @Prop({ required: true, type: [String], default: [] })
  checklist: string[]

  @Prop({ required: true, type: String, default: 'prepared' })
  status: 'prepared' | 'delivered'

  @Prop({ required: true, type: Date })
  exportedAt: Date
}

export const StudioPaidOfferPackageSchema = SchemaFactory.createForClass(StudioPaidOfferPackageEntity)
StudioPaidOfferPackageSchema.index({ userId: 1, contentDraftId: 1 }, { unique: true })
