/* eslint-disable @nx/enforce-module-boundaries -- Intentional bridge to reused SNS adapters while the factory extraction stays minimal. */
import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { Response } from 'express'
import { MetaService } from '../../../aitoearn-server/src/core/channel/platforms/meta/meta.service'
import { TiktokService } from '../../../aitoearn-server/src/core/channel/platforms/tiktok/tiktok.service'
import { TwitterService } from '../../../aitoearn-server/src/core/channel/platforms/twitter/twitter.service'
import { YoutubeService } from '../../../aitoearn-server/src/core/channel/platforms/youtube/youtube.service'
import { FactoryAccountListQueryDto, FactoryConnectAccountDto } from './factory-accounts.dto'
import { FactoryAccountsService } from './factory-accounts.service'

@Controller('accounts')
export class FactoryAccountsController {
  constructor(
    private readonly accountsService: FactoryAccountsService,
    private readonly metaService: MetaService,
    private readonly tiktokService: TiktokService,
    private readonly twitterService: TwitterService,
    private readonly youtubeService: YoutubeService,
  ) {}

  @Get()
  async list(@GetToken() token: TokenInfo, @Query() query: FactoryAccountListQueryDto) {
    return await this.accountsService.list(token, query)
  }

  @Post('connect/:platform')
  async connect(
    @GetToken() token: TokenInfo,
    @Param('platform') platform: string,
    @Body() body: FactoryConnectAccountDto,
  ) {
    return await this.accountsService.connect(token, platform, body)
  }

  @Get('connect/:platform/status/:taskId')
  async getConnectStatus(
    @Param('platform') platform: string,
    @Param('taskId') taskId: string,
  ) {
    return await this.accountsService.getConnectStatus(platform, taskId)
  }

  @Public()
  @Get('connect/twitter/callback')
  async twitterCallback(@Query() query: { code: string, state: string }, @Res() res: Response) {
    const result = await this.twitterService.postOAuth2Callback(query.state, query)
    return res.type('html').send(this.accountsService.renderPopupResult(result, 'x'))
  }

  @Public()
  @Get('connect/tiktok/callback')
  async tiktokCallback(@Query() query: { code: string, state: string }, @Res() res: Response) {
    const result = await this.tiktokService.createAccountAndSetAccessToken(query.state, query)
    return res.type('html').send(this.accountsService.renderPopupResult(result, 'tiktok'))
  }

  @Public()
  @Get('connect/youtube/callback')
  async youtubeCallback(@Query() query: { code: string, state: string }, @Res() res: Response) {
    const state = JSON.parse(decodeURIComponent(query.state)).originalState as string
    const result = await this.youtubeService.setAccessToken(state, query.code)
    return res.type('html').send(this.accountsService.renderPopupResult(result, 'youtube'))
  }

  @Public()
  @Get('connect/meta/callback')
  async metaCallback(@Query() query: { code: string, state: string }, @Res() res: Response) {
    const result = await this.metaService.postOAuth2Callback(query.state, query)
    const accountType = typeof result?.['accountType'] === 'string' ? result.accountType : 'meta'
    return res.type('html').send(this.accountsService.renderPopupResult(result as Record<string, unknown>, accountType))
  }
}
