import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { StudioGenerationService } from './studio-generation.service'
import {
  CreateStudioGenerationRunDto,
  ReviewStudioGeneratedAssetDto,
} from './studio.dto'

@Controller('studio/v1')
export class StudioGenerationController {
  constructor(private readonly studioGenerationService: StudioGenerationService) {}

  @Get('generation-runs')
  async listRuns(@GetToken() token: TokenInfo) {
    return await this.studioGenerationService.listRuns(token.id)
  }

  @Get('generation-runs/:runId')
  async getRun(@GetToken() token: TokenInfo, @Param('runId') runId: string) {
    return await this.studioGenerationService.getRun(token.id, runId)
  }

  @Post('generation-runs')
  async createRun(@GetToken() token: TokenInfo, @Body() body: CreateStudioGenerationRunDto) {
    return await this.studioGenerationService.createRun(token.id, body)
  }

  @Get('generated-assets')
  async listAssets(@GetToken() token: TokenInfo) {
    return await this.studioGenerationService.listAssets(token.id)
  }

  @Post('generated-assets/:generatedAssetId/review')
  async reviewAsset(
    @GetToken() token: TokenInfo,
    @Param('generatedAssetId') generatedAssetId: string,
    @Body() body: ReviewStudioGeneratedAssetDto,
  ) {
    return await this.studioGenerationService.reviewAsset(token.id, generatedAssetId, body)
  }
}
