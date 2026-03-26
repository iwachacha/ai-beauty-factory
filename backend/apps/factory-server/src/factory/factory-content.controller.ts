import { Body, Controller, Get, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { CreateFactoryContentAssetDto } from './factory-content.dto'
import { FactoryContentService } from './factory-content.service'

@Controller('content/assets')
export class FactoryContentController {
  constructor(private readonly contentService: FactoryContentService) {}

  @Get()
  async list(@GetToken() token: TokenInfo) {
    return await this.contentService.list(token)
  }

  @Post()
  async create(@GetToken() token: TokenInfo, @Body() body: CreateFactoryContentAssetDto) {
    return await this.contentService.create(token, body)
  }
}
