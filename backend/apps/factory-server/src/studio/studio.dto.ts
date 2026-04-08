import { createZodDto } from '@yikart/common'
import {
  createStudioChannelAccountRequestSchema,
  createStudioCharacterRequestSchema,
  createStudioContentDraftRequestSchema,
  createStudioFunnelMetricsRequestSchema,
  createStudioGenerationRunRequestSchema,
  createStudioOperatorConfigRequestSchema,
  createStudioPaidOfferPackageRequestSchema,
  createStudioPublicPostPackageRequestSchema,
  createStudioTemplateRequestSchema,
  reviewStudioGeneratedAssetRequestSchema,
} from './studio.contracts'

export class CreateStudioOperatorConfigDto extends createZodDto(createStudioOperatorConfigRequestSchema) {}
export class CreateStudioChannelAccountDto extends createZodDto(createStudioChannelAccountRequestSchema) {}
export class CreateStudioCharacterDto extends createZodDto(createStudioCharacterRequestSchema) {}
export class CreateStudioTemplateDto extends createZodDto(createStudioTemplateRequestSchema) {}
export class CreateStudioGenerationRunDto extends createZodDto(createStudioGenerationRunRequestSchema) {}
export class ReviewStudioGeneratedAssetDto extends createZodDto(reviewStudioGeneratedAssetRequestSchema) {}
export class CreateStudioContentDraftDto extends createZodDto(createStudioContentDraftRequestSchema) {}
export class CreateStudioPublicPostPackageDto extends createZodDto(createStudioPublicPostPackageRequestSchema) {}
export class CreateStudioPaidOfferPackageDto extends createZodDto(createStudioPaidOfferPackageRequestSchema) {}
export class CreateStudioFunnelMetricsDto extends createZodDto(createStudioFunnelMetricsRequestSchema) {}
