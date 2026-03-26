import { Inject, Injectable, Logger } from '@nestjs/common'
import { getErrorMessage } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'
import { FactoryLocalQueueJob } from './factory-local-queue.types'
import { FactoryPublishingErrorHandler } from './factory-publishing-error-handler.service'
import { FactoryPublishingUnrecoverableError } from './factory-publishing.exception'
import { FactoryPublishingService } from './factory-publishing.service'
import { FactoryPublishingProvider } from './factory-publishing.types'

@Injectable()
export class FactoryImmediatePublishConsumer {
  private readonly logger = new Logger(FactoryImmediatePublishConsumer.name)

  @Inject('PUBLISHING_PROVIDERS')
  private readonly publishingProviders: Record<string, FactoryPublishingProvider>

  constructor(
    private readonly publishingService: FactoryPublishingService,
    private readonly errorHandler: FactoryPublishingErrorHandler,
  ) {
  }

  async process(job: FactoryLocalQueueJob<{ taskId: string, attempts: number }>) {
    const task = await this.publishingService.getPublishTaskInfo(job.data.taskId)
    if (!task || task.status === PublishStatus.PUBLISHED || task.status === PublishStatus.PUBLISHING) {
      return
    }

    try {
      await this.publishingService.updatePublishTaskStatus(task.id, {
        status: PublishStatus.PUBLISHING,
        errorMsg: '',
        queued: true,
        inQueue: true,
      })

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
      const result = await provider.immediatePublish(task)

      if (result.status === PublishStatus.PUBLISHED) {
        await provider.completePublishTask(task, result.postId || '', {
          workLink: result.permalink || '',
          ...result.extra,
        })
        await this.publishingService.handleCompletion(task.id)
        return
      }

      if (result.status === PublishStatus.PUBLISHING && result.postId) {
        await this.publishingService.markTaskAsPublishing(task.id, result.postId, result.permalink)
        return
      }

      await this.publishingService.updatePublishTaskStatus(task.id, {
        status: result.status,
        errorMsg: '',
        queued: false,
        inQueue: false,
      })
    }
    catch (error) {
      await this.errorHandler.handle(task.id, error)
    }
  }

  async handleMaxRetries(job: FactoryLocalQueueJob<{ taskId: string }>, error: unknown) {
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      await this.publishingService.updatePublishTaskStatus(job.data.taskId, {
        status: PublishStatus.FAILED,
        errorMsg: (error as Error).message,
        queued: false,
        inQueue: false,
      })
    }
    if (error instanceof FactoryPublishingUnrecoverableError) {
      this.logger.error(getErrorMessage(error))
    }
  }
}
