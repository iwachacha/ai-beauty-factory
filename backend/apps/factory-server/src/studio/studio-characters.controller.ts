import { Body, Controller, Get, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { StudioCharactersService } from './studio-characters.service'
import { CreateStudioCharacterDto } from './studio.dto'

@Controller('studio/v1/characters')
export class StudioCharactersController {
  constructor(private readonly studioCharactersService: StudioCharactersService) {}

  @Get()
  async list(@GetToken() token: TokenInfo) {
    return await this.studioCharactersService.list(token.id)
  }

  @Post()
  async save(@GetToken() token: TokenInfo, @Body() body: CreateStudioCharacterDto) {
    return await this.studioCharactersService.save(token.id, body)
  }
}
