import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { FactoryAccountsService } from './factory-accounts.service'
import { FactoryContentService } from './factory-content.service'
import { CreateFactoryFlowDto } from './factory-flow.dto'
import { FactoryPublishingService } from './publishing/factory-publishing.service'

@Controller('mcp')
export class FactoryMcpController {
  constructor(
    private readonly accountsService: FactoryAccountsService,
    private readonly contentService: FactoryContentService,
    private readonly publishingService: FactoryPublishingService,
  ) {}

  @Get('list_accounts')
  async listAccounts(@GetToken() token: TokenInfo) {
    return await this.accountsService.list(token, {})
  }

  @Get('list_content_assets')
  async listContentAssets(@GetToken() token: TokenInfo) {
    return await this.contentService.list(token)
  }

  @Post('create_flow')
  async createFlow(@GetToken() token: TokenInfo, @Body() body: CreateFactoryFlowDto) {
    return await this.publishingService.createFlow(token, body)
  }

  @Post('enqueue_flow/:flowId')
  async enqueueFlow(@GetToken() token: TokenInfo, @Param('flowId') flowId: string) {
    return await this.publishingService.enqueueFlow(token, flowId)
  }

  @Get('get_job_status/:jobId')
  async getJobStatus(@GetToken() token: TokenInfo, @Param('jobId') jobId: string) {
    return await this.publishingService.getJob(token, jobId)
  }
}
