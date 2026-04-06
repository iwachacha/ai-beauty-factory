import { Body, Controller, Get, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { StudioTemplatesService } from './studio-templates.service'
import { CreateStudioTemplateDto } from './studio.dto'

@Controller('studio/v1/templates')
export class StudioTemplatesController {
  constructor(private readonly studioTemplatesService: StudioTemplatesService) {}

  @Get()
  async list(@GetToken() token: TokenInfo) {
    return await this.studioTemplatesService.list(token.id)
  }

  @Post()
  async save(@GetToken() token: TokenInfo, @Body() body: CreateStudioTemplateDto) {
    return await this.studioTemplatesService.save(token.id, body)
  }
}
