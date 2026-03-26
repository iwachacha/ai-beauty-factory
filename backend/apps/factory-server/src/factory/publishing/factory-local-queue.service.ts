import type { PostMediaTaskData, PostPublishData } from '@yikart/aitoearn-queue'
import type { Job, JobsOptions } from 'bullmq'
import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { QueueName } from '@yikart/aitoearn-queue'
import { PublishStatus } from '@yikart/mongodb'
import { FactoryFinalizePublishConsumer } from './factory-finalize-publish.consumer'
import { FactoryImmediatePublishConsumer } from './factory-immediate-publish.consumer'
import { FactoryLocalQueueJob } from './factory-local-queue.types'
import { FactoryPublishingUnrecoverableError } from './factory-publishing.exception'
import { FactoryPublishingService } from './factory-publishing.service'

type FactoryQueueData = PostPublishData | PostMediaTaskData

@Injectable()
export class FactoryLocalQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(FactoryLocalQueueService.name)
  private readonly pendingTimers = new Map<string, NodeJS.Timeout>()
  private readonly jobs = new Map<string, FactoryLocalQueueJob<FactoryQueueData>>()

  constructor(private readonly moduleRef: ModuleRef) {}

  async addPostPublishJob(data: PostPublishData, options?: JobsOptions) {
    return await this.schedule(QueueName.PostPublish, 'publish', data, options)
  }

  async getPostPublishJob(jobId: string) {
    return this.jobs.get(jobId) as Job<PostPublishData> | undefined
  }

  async addPostMediaTaskJob(data: PostMediaTaskData, options?: JobsOptions) {
    return await this.schedule(QueueName.PostMediaTask, 'media', data, options)
  }

  onModuleDestroy() {
    for (const timer of this.pendingTimers.values()) {
      clearTimeout(timer)
    }
    this.pendingTimers.clear()
    this.jobs.clear()
  }

  private async schedule<T extends FactoryQueueData>(
    queueName: QueueName,
    name: string,
    data: T,
    options?: JobsOptions,
  ) {
    const jobId = String(options?.jobId || data.jobId || randomUUID())
    const job: FactoryLocalQueueJob<T> = {
      id: jobId,
      name,
      data,
      attemptsMade: 0,
      opts: options || {},
    }

    this.jobs.set(jobId, job as FactoryLocalQueueJob<FactoryQueueData>)
    this.scheduleAttempt(queueName, job, 0, this.resolveInitialDelay(options))

    return {
      id: jobId,
      name,
      data,
      opts: options || {},
    }
  }

  private scheduleAttempt<T extends FactoryQueueData>(
    queueName: QueueName,
    job: FactoryLocalQueueJob<T>,
    attempt: number,
    delayMs: number,
  ) {
    const existing = this.pendingTimers.get(job.id)
    if (existing) {
      clearTimeout(existing)
    }

    const timer = setTimeout(() => {
      this.pendingTimers.delete(job.id)
      void this.runJob(queueName, job, attempt)
    }, delayMs)

    this.pendingTimers.set(job.id, timer)
  }

  private async runJob<T extends FactoryQueueData>(
    queueName: QueueName,
    job: FactoryLocalQueueJob<T>,
    attempt: number,
  ) {
    if (!this.jobs.has(job.id)) {
      return
    }

    job.attemptsMade = attempt

    try {
      if (queueName === QueueName.PostPublish) {
        const consumer = this.moduleRef.get(FactoryImmediatePublishConsumer, { strict: false })
        await consumer.process(job as FactoryLocalQueueJob<PostPublishData>)
      }
      else {
        const consumer = this.moduleRef.get(FactoryFinalizePublishConsumer, { strict: false })
        await consumer.process(job as FactoryLocalQueueJob<PostMediaTaskData>)
      }
      this.jobs.delete(job.id)
    }
    catch (error) {
      const maxAttempts = Math.max(job.opts.attempts ?? 1, 1)
      if (!(error instanceof FactoryPublishingUnrecoverableError) && attempt + 1 < maxAttempts) {
        const nextDelay = this.resolveRetryDelay(job.opts, attempt + 1)
        this.logger.warn(`Retrying ${queueName} job ${job.id} in ${nextDelay}ms (${attempt + 2}/${maxAttempts})`)
        this.scheduleAttempt(queueName, job, attempt + 1, nextDelay)
        return
      }

      await this.handleFinalFailure(queueName, job, error)
      this.jobs.delete(job.id)
    }
  }

  private async handleFinalFailure<T extends FactoryQueueData>(
    queueName: QueueName,
    job: FactoryLocalQueueJob<T>,
    error: unknown,
  ) {
    if (queueName === QueueName.PostPublish) {
      const consumer = this.moduleRef.get(FactoryImmediatePublishConsumer, { strict: false })
      await consumer.handleMaxRetries(job as FactoryLocalQueueJob<PostPublishData>, error)
      return
    }

    const taskId = (job.data as PostMediaTaskData).taskId
    const publishingService = this.moduleRef.get(FactoryPublishingService, { strict: false })
    await publishingService.updatePublishTaskStatus(taskId, {
      status: PublishStatus.FAILED,
      errorMsg: error instanceof Error ? error.message : 'Finalize publish failed',
      queued: false,
      inQueue: false,
    })
  }

  private resolveInitialDelay(options?: JobsOptions) {
    return typeof options?.delay === 'number' && options.delay > 0 ? options.delay : 0
  }

  private resolveRetryDelay(options: JobsOptions, nextAttempt: number) {
    const backoff = options.backoff
    if (!backoff) {
      return 0
    }

    if (typeof backoff === 'number') {
      return backoff
    }

    const baseDelay = typeof backoff.delay === 'number' ? backoff.delay : 0
    if (backoff.type === 'exponential') {
      return baseDelay * Math.max(1, 2 ** Math.max(0, nextAttempt - 1))
    }

    return baseDelay
  }
}
