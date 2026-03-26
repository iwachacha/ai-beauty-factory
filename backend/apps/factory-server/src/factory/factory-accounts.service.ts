/* eslint-disable @nx/enforce-module-boundaries -- Intentional bridge to reused SNS adapters while the factory extraction stays minimal. */
import { Injectable, UnprocessableEntityException } from '@nestjs/common'
import { TokenInfo } from '@yikart/aitoearn-auth'
import { AccountType } from '@yikart/common'
import { Account } from '@yikart/mongodb'
import { MetaService } from '../../../aitoearn-server/src/core/channel/platforms/meta/meta.service'
import { TiktokService } from '../../../aitoearn-server/src/core/channel/platforms/tiktok/tiktok.service'
import { TwitterService } from '../../../aitoearn-server/src/core/channel/platforms/twitter/twitter.service'
import { YoutubeService } from '../../../aitoearn-server/src/core/channel/platforms/youtube/youtube.service'
import { config } from '../config'
import { FactoryAccountGroupService } from './factory-account-group.service'
import { FactoryAccountService } from './factory-account.service'
import { FactoryAccountListQueryDto, FactoryConnectAccountDto } from './factory-accounts.dto'
import { FactorySnapshotService } from './factory-snapshot.service'
import { FACTORY_PLATFORM_ALIASES, FACTORY_SUPPORTED_ACCOUNT_TYPES } from './factory.constants'

@Injectable()
export class FactoryAccountsService {
  constructor(
    private readonly accountService: FactoryAccountService,
    private readonly accountGroupService: FactoryAccountGroupService,
    private readonly twitterService: TwitterService,
    private readonly tiktokService: TiktokService,
    private readonly youtubeService: YoutubeService,
    private readonly metaService: MetaService,
    private readonly snapshotService: FactorySnapshotService,
  ) {}

  async list(token: TokenInfo, query: FactoryAccountListQueryDto) {
    const accounts = await this.accountService.getUserAccounts(token.id)
    const filtered = accounts.filter((account) => {
      if (!FACTORY_SUPPORTED_ACCOUNT_TYPES.includes(account.type as (typeof FACTORY_SUPPORTED_ACCOUNT_TYPES)[number])) {
        return false
      }
      if (!query.platform) {
        return true
      }
      return account.type === this.normalizePlatform(query.platform)
    })

    await Promise.all(filtered.map(async (account) => {
      await this.snapshotService.captureAccount(account)
    }))

    return filtered.map(account => this.toResponse(account))
  }

  async connect(token: TokenInfo, platform: string, body: FactoryConnectAccountDto) {
    const normalized = this.normalizePlatform(platform)
    this.assertPlatformConfigured(normalized)
    const groupId = body.groupId || (await this.accountGroupService.getDefaultGroup(token.id)).id

    switch (normalized) {
      case AccountType.TWITTER:
        return await this.twitterService.generateAuthorizeURL({
          userId: token.id,
          spaceId: groupId,
        })
      case AccountType.TIKTOK:
        return await this.tiktokService.getAuthUrl({
          userId: token.id,
          spaceId: groupId,
        })
      case AccountType.YOUTUBE:
        return await this.youtubeService.getAuthUrl(token.id, token.mail || '', undefined, groupId)
      case AccountType.INSTAGRAM:
        return await this.metaService.generateAuthorizeURL(token.id, 'instagram', undefined, groupId)
      case AccountType.THREADS:
        return await this.metaService.generateAuthorizeURL(token.id, 'threads', undefined, groupId)
      default:
        throw new UnprocessableEntityException(`Unsupported platform: ${platform}`)
    }
  }

  async getConnectStatus(platform: string, taskId: string) {
    const normalized = this.normalizePlatform(platform)

    switch (normalized) {
      case AccountType.TWITTER:
        return await this.twitterService.getOAuth2TaskInfo(taskId)
      case AccountType.TIKTOK:
        return await this.tiktokService.getAuthInfo(taskId)
      case AccountType.YOUTUBE:
        return await this.youtubeService.getAuthInfo(taskId)
      case AccountType.INSTAGRAM:
      case AccountType.THREADS:
        return await this.metaService.getOAuth2TaskInfo(taskId)
      default:
        throw new UnprocessableEntityException(`Unsupported platform: ${platform}`)
    }
  }

  renderPopupResult(result: Record<string, unknown> | null | undefined, platform: string) {
    const payload = JSON.stringify({
      ok: !!result && result['status'] === 1,
      platform,
      result: result ?? null,
    })

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Factory Connect</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 24px; background: #f6f7f9; color: #111827; }
      .card { max-width: 420px; margin: 10vh auto 0; padding: 24px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); text-align: center; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      p { margin: 0; color: #4b5563; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Connection finished</h1>
      <p>You can close this window and return to Factory.</p>
    </div>
    <script>
      const payload = ${payload};
      if (window.opener) {
        window.opener.postMessage({ type: 'factory-connect-result', payload }, '*');
      }
      setTimeout(() => window.close(), 500);
    </script>
  </body>
</html>`
  }

  private normalizePlatform(platform: string) {
    const normalized = FACTORY_PLATFORM_ALIASES[platform.toLowerCase() as keyof typeof FACTORY_PLATFORM_ALIASES]
    if (!normalized) {
      throw new UnprocessableEntityException(`Unsupported platform: ${platform}`)
    }
    return normalized
  }

  private assertPlatformConfigured(platform: AccountType) {
    switch (platform) {
      case AccountType.TWITTER:
        if (!config.channel.twitter.clientId || !config.channel.twitter.clientSecret) {
          throw new UnprocessableEntityException('X is not configured yet. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET first.')
        }
        return
      case AccountType.TIKTOK:
        if (!config.channel.tiktok.clientId || !config.channel.tiktok.clientSecret) {
          throw new UnprocessableEntityException('TikTok is not configured yet. Set TIKTOK_CLIENT_ID and TIKTOK_CLIENT_SECRET first.')
        }
        return
      case AccountType.YOUTUBE:
        if (!config.channel.youtube.id || !config.channel.youtube.secret) {
          throw new UnprocessableEntityException('YouTube is not configured yet. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET first.')
        }
        return
      case AccountType.INSTAGRAM:
        if (!config.channel.oauth.instagram.clientId || !config.channel.oauth.instagram.clientSecret) {
          throw new UnprocessableEntityException('Instagram is not configured yet. Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET first.')
        }
        return
      case AccountType.THREADS:
        if (!config.channel.oauth.threads.clientId || !config.channel.oauth.threads.clientSecret) {
          throw new UnprocessableEntityException('Threads is not configured yet. Set THREADS_CLIENT_ID and THREADS_CLIENT_SECRET first.')
        }
        return
      default:
        throw new UnprocessableEntityException(`Unsupported platform: ${platform}`)
    }
  }

  private toResponse(account: Account) {
    return {
      id: account.id,
      platform: account.type === AccountType.TWITTER ? 'x' : account.type,
      accountType: account.type,
      nickname: account.nickname,
      handle: account.account,
      avatar: account.avatar,
      groupId: account.groupId,
      status: account.status,
      followers: account.fansCount,
      views: account.readCount,
      likes: account.likeCount,
      comments: account.commentCount,
      shares: account.forwardCount,
      works: account.workCount,
      connectedAt: account.loginTime,
    }
  }
}
