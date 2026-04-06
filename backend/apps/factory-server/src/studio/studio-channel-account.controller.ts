import { Body, Controller, Get, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { StudioChannelAccountService } from './studio-channel-account.service'
import { CreateStudioChannelAccountDto } from './studio.dto'

@Controller('studio/v1/channel-account')
export class StudioChannelAccountController {
  constructor(private readonly studioChannelAccountService: StudioChannelAccountService) {}

  @Get()
  async getState(@GetToken() token: TokenInfo) {
    return await this.studioChannelAccountService.getState(token.id)
  }

  @Post()
  async activate(@GetToken() token: TokenInfo, @Body() body: CreateStudioChannelAccountDto) {
    await this.studioChannelAccountService.activate(token.id, body.accountId)
    return await this.studioChannelAccountService.getState(token.id)
  }
}
