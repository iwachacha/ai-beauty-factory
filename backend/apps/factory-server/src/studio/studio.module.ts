import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { FactoryAccountService } from '../factory/factory-account.service'
import { PromptComposerService } from './prompt-composer.service'
import { ComfyUiGenerationProvider } from './providers/comfyui.provider'
import { StudioChannelAccountEntity, StudioChannelAccountSchema } from './storage/studio-channel-account.schema'
import { StudioCharacterProfileEntity, StudioCharacterProfileSchema } from './storage/studio-character-profile.schema'
import { StudioContentDraftEntity, StudioContentDraftSchema } from './storage/studio-content-draft.schema'
import { StudioFunnelMetricsEntity, StudioFunnelMetricsSchema } from './storage/studio-funnel-metrics.schema'
import { StudioGeneratedAssetEntity, StudioGeneratedAssetSchema } from './storage/studio-generated-asset.schema'
import { StudioGenerationRunEntity, StudioGenerationRunSchema } from './storage/studio-generation-run.schema'
import { StudioOperatorConfigEntity, StudioOperatorConfigSchema } from './storage/studio-operator-config.schema'
import { StudioPaidOfferPackageEntity, StudioPaidOfferPackageSchema } from './storage/studio-paid-offer-package.schema'
import { StudioPromptTemplateEntity, StudioPromptTemplateSchema } from './storage/studio-prompt-template.schema'
import { StudioPublicPostPackageEntity, StudioPublicPostPackageSchema } from './storage/studio-public-post-package.schema'
import { StudioChannelAccountController } from './studio-channel-account.controller'
import { StudioChannelAccountService } from './studio-channel-account.service'
import { StudioCharactersController } from './studio-characters.controller'
import { StudioCharactersService } from './studio-characters.service'
import { StudioGenerationController } from './studio-generation.controller'
import { StudioGenerationService } from './studio-generation.service'
import { StudioOperatorConfigController } from './studio-operator-config.controller'
import { StudioOperatorConfigService } from './studio-operator-config.service'
import { StudioPublishingController } from './studio-publishing.controller'
import { StudioPublishingService } from './studio-publishing.service'
import { StudioTemplatesController } from './studio-templates.controller'
import { StudioTemplatesService } from './studio-templates.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudioChannelAccountEntity.name, schema: StudioChannelAccountSchema },
      { name: StudioCharacterProfileEntity.name, schema: StudioCharacterProfileSchema },
      { name: StudioPromptTemplateEntity.name, schema: StudioPromptTemplateSchema },
      { name: StudioGenerationRunEntity.name, schema: StudioGenerationRunSchema },
      { name: StudioGeneratedAssetEntity.name, schema: StudioGeneratedAssetSchema },
      { name: StudioContentDraftEntity.name, schema: StudioContentDraftSchema },
      { name: StudioPublicPostPackageEntity.name, schema: StudioPublicPostPackageSchema },
      { name: StudioPaidOfferPackageEntity.name, schema: StudioPaidOfferPackageSchema },
      { name: StudioFunnelMetricsEntity.name, schema: StudioFunnelMetricsSchema },
      { name: StudioOperatorConfigEntity.name, schema: StudioOperatorConfigSchema },
    ]),
  ],
  controllers: [
    StudioOperatorConfigController,
    StudioChannelAccountController,
    StudioCharactersController,
    StudioTemplatesController,
    StudioGenerationController,
    StudioPublishingController,
  ],
  providers: [
    FactoryAccountService,
    StudioOperatorConfigService,
    StudioChannelAccountService,
    StudioCharactersService,
    StudioTemplatesService,
    StudioGenerationService,
    StudioPublishingService,
    PromptComposerService,
    ComfyUiGenerationProvider,
    {
      provide: 'STUDIO_GENERATION_PROVIDER',
      useExisting: ComfyUiGenerationProvider,
    },
  ],
  exports: [
    FactoryAccountService,
    StudioOperatorConfigService,
    StudioChannelAccountService,
    StudioCharactersService,
    StudioTemplatesService,
    StudioGenerationService,
    StudioPublishingService,
  ],
})
export class StudioModule {}
