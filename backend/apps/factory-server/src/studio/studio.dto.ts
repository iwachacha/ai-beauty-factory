import { createZodDto } from '@yikart/common'
import {
  createStudioChannelAccountRequestSchema,
  createStudioCharacterRequestSchema,
  createStudioContentDraftRequestSchema,
  createStudioGenerationRunRequestSchema,
  createStudioPublishedPostRequestSchema,
  createStudioPublishPackageRequestSchema,
  createStudioTemplateRequestSchema,
  reviewStudioGeneratedAssetRequestSchema,
} from './studio.contracts'

export class CreateStudioChannelAccountDto extends createZodDto(createStudioChannelAccountRequestSchema) {}
export class CreateStudioCharacterDto extends createZodDto(createStudioCharacterRequestSchema) {}
export class CreateStudioTemplateDto extends createZodDto(createStudioTemplateRequestSchema) {}
export class CreateStudioGenerationRunDto extends createZodDto(createStudioGenerationRunRequestSchema) {}
export class ReviewStudioGeneratedAssetDto extends createZodDto(reviewStudioGeneratedAssetRequestSchema) {}
export class CreateStudioContentDraftDto extends createZodDto(createStudioContentDraftRequestSchema) {}
export class CreateStudioPublishPackageDto extends createZodDto(createStudioPublishPackageRequestSchema) {}
export class CreateStudioPublishedPostDto extends createZodDto(createStudioPublishedPostRequestSchema) {}
