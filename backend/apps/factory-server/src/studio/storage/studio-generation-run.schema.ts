import type { StudioParameterSnapshot, StudioPromptSnapshot } from '../studio.contracts'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS, WithTimestampSchema } from '@yikart/mongodb'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'studio_generation_run' })
export class StudioGenerationRunEntity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, type: String, index: true })
  characterId: string

  @Prop({ required: true, type: String, index: true })
  templateId: string

  @Prop({ required: true, type: String, default: 'x' })
  targetPlatform: 'x'

  @Prop({ required: true, type: String, default: 'free_sns' })
  targetTier: 'free_sns' | 'subscriber' | 'premium'

  @Prop({ required: true, type: String })
  workflowVersion: string

  @Prop({ required: true, type: Object })
  promptSnapshot: StudioPromptSnapshot

  @Prop({ required: true, type: Object })
  parameterSnapshot: StudioParameterSnapshot

  @Prop({ required: true, type: String, default: 'queued', index: true })
  status: 'queued' | 'running' | 'completed' | 'failed'

  @Prop({ required: false, type: String, default: null })
  error: string | null

  @Prop({ required: false, type: String, default: null })
  providerJobId: string | null

  @Prop({ required: false, type: Date, default: null })
  startedAt: Date | null

  @Prop({ required: false, type: Date, default: null })
  completedAt: Date | null
}

export const StudioGenerationRunSchema = SchemaFactory.createForClass(StudioGenerationRunEntity)
StudioGenerationRunSchema.index({ userId: 1, createdAt: -1 })
