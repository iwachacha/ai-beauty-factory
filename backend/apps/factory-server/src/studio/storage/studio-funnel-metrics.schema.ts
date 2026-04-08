import type { StudioPaidMetrics, StudioPublicMetrics } from '../studio.contracts'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_funnel_metrics' })
export class StudioFunnelMetricsEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  publicPostPackageId: string

  @Prop({ required: true, type: String, index: true })
  paidOfferPackageId: string

  @Prop({ required: false, type: String, default: null })
  publicPostUrl: string | null

  @Prop({ required: true, type: Date })
  recordedAt: Date

  @Prop({ required: true, type: Object })
  publicMetrics: StudioPublicMetrics

  @Prop({ required: true, type: Object })
  paidMetrics: StudioPaidMetrics

  @Prop({ required: false, type: String, default: '' })
  operatorMemo: string
}

export const StudioFunnelMetricsSchema = SchemaFactory.createForClass(StudioFunnelMetricsEntity)
StudioFunnelMetricsSchema.index({ userId: 1, recordedAt: -1 })
StudioFunnelMetricsSchema.index({ userId: 1, publicPostPackageId: 1, paidOfferPackageId: 1 }, { unique: true })
