import { Body, Controller, Get, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { StudioOperatorConfigService } from './studio-operator-config.service'
import { CreateStudioOperatorConfigDto } from './studio.dto'

@Controller('studio/v1/operator-config')
export class StudioOperatorConfigController {
  constructor(private readonly studioOperatorConfigService: StudioOperatorConfigService) {}

  @Get()
  async get(@GetToken() token: TokenInfo) {
    return await this.studioOperatorConfigService.get(token.id)
  }

  @Post()
  async save(@GetToken() token: TokenInfo, @Body() body: CreateStudioOperatorConfigDto) {
    return await this.studioOperatorConfigService.save(token.id, body)
  }
}
