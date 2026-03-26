import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { AitoearnAuthModule } from '@yikart/aitoearn-auth'
import { AssetsHttpModule } from '@yikart/assets'
import { ChannelDbModule } from '@yikart/channel-db'
import { MongodbModule } from '@yikart/mongodb'
import { RedisModule } from '@yikart/redis'
import { config } from './config'
import { FactoryModule } from './factory/factory.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    MongodbModule.forRoot(config.mongodb),
    ChannelDbModule.forRoot(config.channel.channelDb),
    RedisModule.forRoot(config.redis),
    AitoearnAuthModule.forRoot(config.auth),
    AssetsHttpModule.forRoot({
      assetsConfig: config.assets,
      enableScheduler: false,
    }),
    FactoryModule,
  ],
})
export class AppModule {}
