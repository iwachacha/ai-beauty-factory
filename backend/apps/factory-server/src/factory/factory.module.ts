/* eslint-disable @nx/enforce-module-boundaries -- Intentional bridge to reused official adapters/providers while the factory extraction remains lightweight. */
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { QueueService } from '@yikart/aitoearn-queue'
import { AccountType } from '@yikart/common'
import { InstagramService as InstagramApiService } from '../../../aitoearn-server/src/core/channel/libs/instagram/instagram.service'
import { ThreadsService as ThreadsApiService } from '../../../aitoearn-server/src/core/channel/libs/threads/threads.service'
import { TiktokService as TiktokApiService } from '../../../aitoearn-server/src/core/channel/libs/tiktok/tiktok.service'
import { TwitterService as TwitterApiService } from '../../../aitoearn-server/src/core/channel/libs/twitter/twitter.service'
import { YoutubeApiService } from '../../../aitoearn-server/src/core/channel/libs/youtube/youtube-api.service'
import { ChannelAccountService } from '../../../aitoearn-server/src/core/channel/platforms/channel-account.service'
import { InstagramService } from '../../../aitoearn-server/src/core/channel/platforms/meta/instagram.service'
import { MetaService } from '../../../aitoearn-server/src/core/channel/platforms/meta/meta.service'
import { ThreadsService } from '../../../aitoearn-server/src/core/channel/platforms/meta/threads.service'
import { TiktokService } from '../../../aitoearn-server/src/core/channel/platforms/tiktok/tiktok.service'
import { TwitterService } from '../../../aitoearn-server/src/core/channel/platforms/twitter/twitter.service'
import { YoutubeService } from '../../../aitoearn-server/src/core/channel/platforms/youtube/youtube.service'
import { MediaStagingService } from '../../../aitoearn-server/src/core/channel/publishing/media-staging.service'
import { InstagramPublishService } from '../../../aitoearn-server/src/core/channel/publishing/providers/instgram.service'
import { ThreadsPublishService } from '../../../aitoearn-server/src/core/channel/publishing/providers/threads.service'
import { TiktokPubService } from '../../../aitoearn-server/src/core/channel/publishing/providers/tiktok.service'
import { TwitterPubService } from '../../../aitoearn-server/src/core/channel/publishing/providers/twitter.service'
import { YoutubePubService } from '../../../aitoearn-server/src/core/channel/publishing/providers/youtube.service'
import { MediaGroupService } from '../../../aitoearn-server/src/core/content/media-group.service'
import { MediaService } from '../../../aitoearn-server/src/core/content/media.service'
import { PublishRecordService as LegacyPublishRecordService } from '../../../aitoearn-server/src/core/publish-record/publish-record.service'
import { PromptComposerService } from '../studio/prompt-composer.service'
import { ComfyUiGenerationProvider } from '../studio/providers/comfyui.provider'
import { StudioChannelAccountEntity, StudioChannelAccountSchema } from '../studio/storage/studio-channel-account.schema'
import { StudioCharacterProfileEntity, StudioCharacterProfileSchema } from '../studio/storage/studio-character-profile.schema'
import { StudioContentDraftEntity, StudioContentDraftSchema } from '../studio/storage/studio-content-draft.schema'
import { StudioGeneratedAssetEntity, StudioGeneratedAssetSchema } from '../studio/storage/studio-generated-asset.schema'
import { StudioGenerationRunEntity, StudioGenerationRunSchema } from '../studio/storage/studio-generation-run.schema'
import { StudioPromptTemplateEntity, StudioPromptTemplateSchema } from '../studio/storage/studio-prompt-template.schema'
import { StudioPublishPackageEntity, StudioPublishPackageSchema } from '../studio/storage/studio-publish-package.schema'
import { StudioPublishedPostEntity, StudioPublishedPostSchema } from '../studio/storage/studio-published-post.schema'
import { StudioChannelAccountController } from '../studio/studio-channel-account.controller'
import { StudioChannelAccountService } from '../studio/studio-channel-account.service'
import { StudioCharactersController } from '../studio/studio-characters.controller'
import { StudioCharactersService } from '../studio/studio-characters.service'
import { StudioGenerationController } from '../studio/studio-generation.controller'
import { StudioGenerationService } from '../studio/studio-generation.service'
import { StudioPublishingController } from '../studio/studio-publishing.controller'
import { StudioPublishingService } from '../studio/studio-publishing.service'
import { StudioTemplatesController } from '../studio/studio-templates.controller'
import { StudioTemplatesService } from '../studio/studio-templates.service'
import { FactoryAccountGroupService } from './factory-account-group.service'
import { FactoryAccountService } from './factory-account.service'
import { FactoryAccountsController } from './factory-accounts.controller'
import { FactoryAccountsService } from './factory-accounts.service'
import { FactoryApiKeyService } from './factory-api-key.service'
import { FactoryAuthController } from './factory-auth.controller'
import { FactoryAuthService } from './factory-auth.service'
import { FactoryBootstrapService } from './factory-bootstrap.service'
import { FactoryContentController } from './factory-content.controller'

import { FactoryContentService } from './factory-content.service'
import { FactoryFlowController } from './factory-flow.controller'
import { FactoryMaterialGroupService } from './factory-material-group.service'
import { FactoryMaterialService } from './factory-material.service'
import { FactoryMcpController } from './factory-mcp.controller'
import { FactoryPublishRecordService } from './factory-publish-record.service'
import { FactorySettingsController } from './factory-settings.controller'
import { FactorySnapshotService } from './factory-snapshot.service'
import { FactoryCredentialInvalidationService } from './publishing/factory-credential-invalidation.service'
import { FactoryEnqueueScheduler } from './publishing/factory-enqueue.scheduler'
import { FactoryFinalizePublishConsumer } from './publishing/factory-finalize-publish.consumer'
import { FactoryImmediatePublishConsumer } from './publishing/factory-immediate-publish.consumer'
import { FactoryLocalQueueService } from './publishing/factory-local-queue.service'
import { FactoryPublishingErrorHandler } from './publishing/factory-publishing-error-handler.service'
import { FactoryPublishingService } from './publishing/factory-publishing.service'
import { FactoryAccountSnapshot, FactoryAccountSnapshotSchema } from './storage/account-snapshot.schema'
import { FactoryFlowRepository } from './storage/factory-flow.repository'
import { FactorySnapshotRepository } from './storage/factory-snapshot.repository'
import { FactoryFlow, FactoryFlowSchema } from './storage/flow.schema'
import { FactoryPostSnapshot, FactoryPostSnapshotSchema } from './storage/post-snapshot.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FactoryFlow.name, schema: FactoryFlowSchema },
      { name: FactoryAccountSnapshot.name, schema: FactoryAccountSnapshotSchema },
      { name: FactoryPostSnapshot.name, schema: FactoryPostSnapshotSchema },
      { name: StudioChannelAccountEntity.name, schema: StudioChannelAccountSchema },
      { name: StudioCharacterProfileEntity.name, schema: StudioCharacterProfileSchema },
      { name: StudioPromptTemplateEntity.name, schema: StudioPromptTemplateSchema },
      { name: StudioGenerationRunEntity.name, schema: StudioGenerationRunSchema },
      { name: StudioGeneratedAssetEntity.name, schema: StudioGeneratedAssetSchema },
      { name: StudioContentDraftEntity.name, schema: StudioContentDraftSchema },
      { name: StudioPublishPackageEntity.name, schema: StudioPublishPackageSchema },
      { name: StudioPublishedPostEntity.name, schema: StudioPublishedPostSchema },
    ]),
  ],
  controllers: [
    FactoryAuthController,
    FactoryAccountsController,
    FactoryContentController,
    FactoryFlowController,
    FactoryMcpController,
    FactorySettingsController,
    StudioChannelAccountController,
    StudioCharactersController,
    StudioTemplatesController,
    StudioGenerationController,
    StudioPublishingController,
  ],
  providers: [
    MediaService,
    MediaGroupService,
    FactoryAccountService,
    FactoryAccountGroupService,
    FactoryMaterialGroupService,
    FactoryMaterialService,
    FactoryPublishRecordService,
    FactoryApiKeyService,
    FactoryFlowRepository,
    FactorySnapshotRepository,
    ChannelAccountService,
    InstagramApiService,
    ThreadsApiService,
    TiktokApiService,
    TwitterApiService,
    YoutubeApiService,
    MetaService,
    InstagramService,
    ThreadsService,
    TiktokService,
    TwitterService,
    YoutubeService,
    MediaStagingService,
    InstagramPublishService,
    ThreadsPublishService,
    TiktokPubService,
    TwitterPubService,
    YoutubePubService,
    FactoryBootstrapService,
    FactoryAuthService,
    FactorySnapshotService,
    FactoryAccountsService,
    FactoryContentService,
    FactoryLocalQueueService,
    FactoryPublishingService,
    FactoryCredentialInvalidationService,
    FactoryPublishingErrorHandler,
    FactoryEnqueueScheduler,
    FactoryImmediatePublishConsumer,
    FactoryFinalizePublishConsumer,
    StudioChannelAccountService,
    StudioCharactersService,
    StudioTemplatesService,
    StudioGenerationService,
    StudioPublishingService,
    PromptComposerService,
    ComfyUiGenerationProvider,
    {
      provide: LegacyPublishRecordService,
      useExisting: FactoryPublishRecordService,
    },
    {
      provide: QueueService,
      useExisting: FactoryLocalQueueService,
    },
    {
      provide: 'PUBLISHING_PROVIDERS',
      useFactory: (
        twitter: TwitterPubService,
        instagram: InstagramPublishService,
        threads: ThreadsPublishService,
        tiktok: TiktokPubService,
        youtube: YoutubePubService,
      ) => ({
        [AccountType.TWITTER]: twitter,
        [AccountType.INSTAGRAM]: instagram,
        [AccountType.THREADS]: threads,
        [AccountType.TIKTOK]: tiktok,
        [AccountType.YOUTUBE]: youtube,
      }),
      inject: [
        TwitterPubService,
        InstagramPublishService,
        ThreadsPublishService,
        TiktokPubService,
        YoutubePubService,
      ],
    },
    {
      provide: 'STUDIO_GENERATION_PROVIDER',
      useExisting: ComfyUiGenerationProvider,
    },
  ],
})
export class FactoryModule {}
