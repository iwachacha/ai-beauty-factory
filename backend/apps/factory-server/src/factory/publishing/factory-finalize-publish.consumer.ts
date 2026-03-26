import { Inject, Injectable } from '@nestjs/common'
import { PublishStatus } from '@yikart/mongodb'
import { FactoryLocalQueueJob } from './factory-local-queue.types'
import { FactoryPublishingErrorHandler } from './factory-publishing-error-handler.service'
import { FactoryPublishingService } from './factory-publishing.service'
import { FactoryPublishingProvider } from './factory-publishing.types'

@Injectable()
export class FactoryFinalizePublishConsumer {
  @Inject('PUBLISHING_PROVIDERS')
  private readonly publishingProviders: Record<string, FactoryPublishingProvider>

  constructor(
    private readonly publishingService: FactoryPublishingService,
    private readonly errorHandler: FactoryPublishingErrorHandler,
  ) {
  }

  async process(job: FactoryLocalQueueJob<{ taskId: string }>) {
    const task = await this.publishingService.getPublishTaskInfo(job.data.taskId)
    if (!task) {
      return
    }

    try {
      const provider = this.publishingProviders[task.accountType]
      if (!provider) {
        await this.publishingService.updatePublishTaskStatus(task.id, {
          status: PublishStatus.FAILED,
          errorMsg: `Unsupported account type: ${task.accountType}`,
          queued: false,
          inQueue: false,
        })
        return
      }
      const result = await provider.finalizePublish(task)
      if (result && result.status === PublishStatus.PUBLISHED) {
        await provider.completePublishTask(task, result.postId || '', {
          workLink: result.permalink || '',
          ...result.extra,
        })
        await this.publishingService.handleCompletion(task.id)
      }
    }
    catch (error) {
      await this.errorHandler.handle(task.id, error)
    }
  }
}
