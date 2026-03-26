import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { CreateFactoryFlowDto, EnqueueFactoryFlowDto, FactoryJobsQueryDto } from './factory-flow.dto'
import { FactoryPublishingService } from './publishing/factory-publishing.service'

@Controller()
export class FactoryFlowController {
  constructor(private readonly publishingService: FactoryPublishingService) {}

  @Get('flows')
  async listFlows(@GetToken() token: TokenInfo) {
    return await this.publishingService.listFlows(token)
  }

  @Get('flows/:flowId')
  async getFlow(@GetToken() token: TokenInfo, @Param('flowId') flowId: string) {
    return await this.publishingService.getFlow(token, flowId)
  }

  @Post('flows')
  async createFlow(@GetToken() token: TokenInfo, @Body() body: CreateFactoryFlowDto) {
    return await this.publishingService.createFlow(token, body)
  }

  @Post('flows/:flowId/enqueue')
  async enqueueFlow(
    @GetToken() token: TokenInfo,
    @Param('flowId') flowId: string,
    @Body() body: EnqueueFactoryFlowDto,
  ) {
    return await this.publishingService.enqueueFlow(token, flowId, body.scheduleAt)
  }

  @Get('jobs')
  async getJobs(@GetToken() token: TokenInfo, @Query() query: FactoryJobsQueryDto) {
    return await this.publishingService.getJobs(token, query)
  }

  @Get('jobs/:jobId')
  async getJob(@GetToken() token: TokenInfo, @Param('jobId') jobId: string) {
    return await this.publishingService.getJob(token, jobId)
  }

  @Post('jobs/:jobId/retry')
  async retryJob(@GetToken() token: TokenInfo, @Param('jobId') jobId: string) {
    return await this.publishingService.retryJob(token, jobId)
  }
}
