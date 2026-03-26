import { Injectable, Logger } from '@nestjs/common'
import { OAuth2CredentialRepository } from '@yikart/channel-db'
import { AccountType } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { FactoryChannelRedisKeys } from './factory-channel-redis.keys'

@Injectable()
export class FactoryCredentialInvalidationService {
  private readonly logger = new Logger(FactoryCredentialInvalidationService.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly oauth2CredentialRepository: OAuth2CredentialRepository,
  ) {}

  async invalidate(accountId: string, accountType: AccountType): Promise<void> {
    try {
      const key = this.getRedisKey(accountId, accountType)
      if (key) {
        await this.redisService.del(key)
      }
      await this.oauth2CredentialRepository.delOne(accountId, accountType)
    }
    catch (error) {
      this.logger.warn(`Failed to invalidate credentials for ${accountType}:${accountId}: ${(error as Error).message}`)
    }
  }

  private getRedisKey(accountId: string, accountType: AccountType) {
    switch (accountType) {
      case AccountType.TWITTER:
        return FactoryChannelRedisKeys.accessToken('twitter', accountId)
      case AccountType.TIKTOK:
        return FactoryChannelRedisKeys.accessToken('tiktok', accountId)
      case AccountType.INSTAGRAM:
      case AccountType.THREADS:
        return FactoryChannelRedisKeys.accessToken(accountType, accountId)
      case AccountType.YOUTUBE:
        return `${accountType}:accessToken:${accountId}`
      default:
        return ''
    }
  }
}
