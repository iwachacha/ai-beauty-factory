import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { FactoryPublishingService } from './factory-publishing.service'

@Injectable()
export class FactoryEnqueueScheduler {
  constructor(private readonly publishingService: FactoryPublishingService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async enqueueDueTasks() {
    await this.publishingService.enqueueDueTasks()
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async verifyPublishingTasks() {
    await this.publishingService.verifyPublishingTasks()
  }
}
