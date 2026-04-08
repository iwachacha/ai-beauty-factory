import { Body, Controller, Get, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { StudioPublishingService } from './studio-publishing.service'
import {
  CreateStudioContentDraftDto,
  CreateStudioFunnelMetricsDto,
  CreateStudioPaidOfferPackageDto,
  CreateStudioPublicPostPackageDto,
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

  @Get('public-post-packages')
  async listPublicPostPackages(@GetToken() token: TokenInfo) {
    return await this.studioPublishingService.listPublicPostPackages(token.id)
  }

  @Post('public-post-packages')
  async createPublicPostPackage(@GetToken() token: TokenInfo, @Body() body: CreateStudioPublicPostPackageDto) {
    return await this.studioPublishingService.createPublicPostPackage(token.id, body)
  }

  @Get('paid-offer-packages')
  async listPaidOfferPackages(@GetToken() token: TokenInfo) {
    return await this.studioPublishingService.listPaidOfferPackages(token.id)
  }

  @Post('paid-offer-packages')
  async createPaidOfferPackage(@GetToken() token: TokenInfo, @Body() body: CreateStudioPaidOfferPackageDto) {
    return await this.studioPublishingService.createPaidOfferPackage(token.id, body)
  }

  @Post('funnel-metrics')
  async createFunnelMetrics(@GetToken() token: TokenInfo, @Body() body: CreateStudioFunnelMetricsDto) {
    return await this.studioPublishingService.recordFunnelMetrics(token.id, body)
  }

  @Get('insights')
  async getInsights(@GetToken() token: TokenInfo) {
    return await this.studioPublishingService.getInsights(token.id)
  }
}
