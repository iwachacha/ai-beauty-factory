import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { FactoryApiKeyService } from './factory-api-key.service'
import { CreateFactoryApiKeyDto } from './factory-flow.dto'

@Controller('settings/api-keys')
export class FactorySettingsController {
  constructor(private readonly apiKeyService: FactoryApiKeyService) {}

  @Get()
  async list(@GetToken() token: TokenInfo) {
    return await this.apiKeyService.listByUserId(token.id)
  }

  @Post()
  async create(@GetToken() token: TokenInfo, @Body() body: CreateFactoryApiKeyDto) {
    return await this.apiKeyService.create(token.id, body.name)
  }

  @Delete(':id')
  async remove(@GetToken() token: TokenInfo, @Param('id') id: string) {
    await this.apiKeyService.deleteByIdAndUserId(id, token.id)
    return { success: true }
  }
}
