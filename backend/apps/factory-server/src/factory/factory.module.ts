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

import { FactoryBeautyCharactersController } from './factory-beauty-characters.controller'
import { FactoryBeautyCharactersService } from './factory-beauty-characters.service'
import { FactoryBeautyTemplatesController } from './factory-beauty-templates.controller'
import { FactoryBeautyTemplatesService } from './factory-beauty-templates.service'
import { FactoryBeautyCalendarController } from './factory-beauty-calendar.controller'
import { FactoryBeautyCalendarService } from './factory-beauty-calendar.service'
import { FactoryBeautyMonetizationController } from './factory-beauty-monetization.controller'
import { FactoryBeautyMonetizationService } from './factory-beauty-monetization.service'
import { FactoryBeautyComfyuiService } from './factory-beauty-comfyui.service'


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FactoryFlow.name, schema: FactoryFlowSchema },
      { name: FactoryAccountSnapshot.name, schema: FactoryAccountSnapshotSchema },
      { name: FactoryPostSnapshot.name, schema: FactoryPostSnapshotSchema },
    ]),
  ],
  controllers: [
    FactoryAuthController,
    FactoryAccountsController,
    FactoryContentController,
    FactoryFlowController,
    FactoryMcpController,
    FactorySettingsController,
    FactoryBeautyCharactersController,
    FactoryBeautyTemplatesController,
    FactoryBeautyCalendarController,
    FactoryBeautyMonetizationController,
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
    FactoryBeautyCharactersService,
    FactoryBeautyTemplatesService,
    FactoryBeautyCalendarService,
    FactoryBeautyMonetizationService,
    FactoryBeautyComfyuiService,
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
  ],
})
export class FactoryModule {}
