import { Injectable } from '@nestjs/common'
import { AccountType, getErrorMessage } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'
import { FactoryCredentialInvalidationService } from './factory-credential-invalidation.service'
import {
  FactoryPublishingUnrecoverableError,
  isFactoryPublishingException,
  isFactorySocialMediaError,
} from './factory-publishing.exception'
import { FactoryPublishingService } from './factory-publishing.service'

@Injectable()
export class FactoryPublishingErrorHandler {
  constructor(
    private readonly publishingService: FactoryPublishingService,
    private readonly credentialInvalidationService: FactoryCredentialInvalidationService,
  ) {}

  async handle(taskId: string, error: unknown): Promise<never> {
    if (isFactoryPublishingException(error)) {
      if (error.retryable) {
        throw error
      }
      await this.failTask(taskId, error.message)
      throw new FactoryPublishingUnrecoverableError(error.message, error)
    }

    if (isFactorySocialMediaError(error)) {
      if (error.isNetworkError) {
        throw error
      }
      if (error.status === 401) {
        const task = await this.publishingService.getPublishTaskInfo(taskId)
        if (task?.accountId) {
          await this.credentialInvalidationService.invalidate(task.accountId, task.accountType as AccountType)
        }
      }
      await this.failTask(taskId, error.message || 'Client error')
      throw new FactoryPublishingUnrecoverableError(error.message || 'Client error', error)
    }

    const message = getErrorMessage(error) || 'Unknown error'
    await this.failTask(taskId, message)
    throw new FactoryPublishingUnrecoverableError(message, error)
  }

  private async failTask(taskId: string, message: string) {
    await this.publishingService.updatePublishTaskStatus(taskId, {
      status: PublishStatus.FAILED,
      errorMsg: message,
      inQueue: false,
      queued: false,
    })
  }
}
