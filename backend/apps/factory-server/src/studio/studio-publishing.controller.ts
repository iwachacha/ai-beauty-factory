import { Body, Controller, Get, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { StudioPublishingService } from './studio-publishing.service'
import {
  CreateStudioContentDraftDto,
  CreateStudioPublishedPostDto,
  CreateStudioPublishPackageDto,
} from './studio.dto'

@Controller('studio/v1')
export class StudioPublishingController {
  constructor(private readonly studioPublishingService: StudioPublishingService) {}

  @Get('content-drafts')
  async listDrafts(@GetToken() token: TokenInfo) {
    return await this.studioPublishingService.listDrafts(token.id)
  }

  @Post('content-drafts')
  async createDraft(@GetToken() token: TokenInfo, @Body() body: CreateStudioContentDraftDto) {
    return await this.studioPublishingService.createDraft(token.id, body)
  }

  @Get('publish-packages')
  async listPublishPackages(@GetToken() token: TokenInfo) {
    return await this.studioPublishingService.listPublishPackages(token.id)
  }

  @Post('publish-packages')
  async createPublishPackage(@GetToken() token: TokenInfo, @Body() body: CreateStudioPublishPackageDto) {
    return await this.studioPublishingService.createPublishPackage(token.id, body)
  }

  @Post('published-posts')
  async createPublishedPost(@GetToken() token: TokenInfo, @Body() body: CreateStudioPublishedPostDto) {
    return await this.studioPublishingService.recordPublishedPost(token.id, body)
  }

  @Get('insights')
  async getInsights(@GetToken() token: TokenInfo) {
    return await this.studioPublishingService.getInsights(token.id)
  }
}
