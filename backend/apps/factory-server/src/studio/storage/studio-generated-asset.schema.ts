import type { StudioQualityCheck, StudioRejectReason } from '../studio.contracts'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_generated_asset' })
export class StudioGeneratedAssetEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  generationRunId: string

  @Prop({ required: true, type: String })
  assetId: string

  @Prop({ required: true, type: String })
  previewUrl: string

  @Prop({ required: true, type: String, default: 'pending_review', index: true })
  reviewStatus: 'pending_review' | 'approved' | 'rejected' | 'needs_regenerate'

  @Prop({ required: false, type: Number, default: null })
  reviewScore: number | null

  @Prop({ required: true, type: [String], default: [] })
  rejectionReasons: StudioRejectReason[]

  @Prop({ required: false, type: String, default: '' })
  operatorNote: string

  @Prop({ required: true, type: [Object], default: [] })
  qualityChecks: StudioQualityCheck[]
}

export const StudioGeneratedAssetSchema = SchemaFactory.createForClass(StudioGeneratedAssetEntity)
StudioGeneratedAssetSchema.index({ userId: 1, reviewStatus: 1, createdAt: -1 })
