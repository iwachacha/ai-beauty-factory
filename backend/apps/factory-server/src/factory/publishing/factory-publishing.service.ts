import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common'
import { TokenInfo } from '@yikart/aitoearn-auth'
import { AccountType } from '@yikart/common'
import { Account, Material, PublishRecord, PublishRecordSource, PublishStatus, PublishType, UserRepository } from '@yikart/mongodb'
import { FactoryAccountService } from '../factory-account.service'
import { FactoryMaterialService } from '../factory-material.service'
import { FactoryPublishRecordService } from '../factory-publish-record.service'
import { FactorySnapshotService } from '../factory-snapshot.service'
import { FACTORY_SUPPORTED_ACCOUNT_TYPES } from '../factory.constants'
import { FactoryFlowRepository } from '../storage/factory-flow.repository'
import { FactoryFlow } from '../storage/flow.schema'
import { FactoryPublishingProvider } from './factory-publishing.types'

@Injectable()
export class FactoryPublishingService {
  constructor(
    private readonly flowRepository: FactoryFlowRepository,
    private readonly accountService: FactoryAccountService,
    private readonly materialService: FactoryMaterialService,
    private readonly publishRecordService: FactoryPublishRecordService,
    private readonly snapshotService: FactorySnapshotService,
    private readonly userRepository: UserRepository,
    @Inject('PUBLISHING_PROVIDERS')
    private readonly publishingProviders: Record<string, FactoryPublishingProvider>,
  ) {}

  async createFlow(token: TokenInfo, body: {
    name: string
    contentAssetId: string
    targetAccountIds: string[]
    scheduleAt?: Date
    platformOptions?: Record<string, Record<string, unknown>>
  }) {
    const accounts = await this.assertAccounts(token.id, body.targetAccountIds)
    await this.assertContentAsset(token.id, body.contentAssetId)

    const flow = await this.flowRepository.create({
      userId: token.id,
      name: body.name,
      contentAssetId: body.contentAssetId,
      targetAccountIds: accounts.map(account => account.id),
      scheduleAt: body.scheduleAt,
      status: body.scheduleAt ? 'scheduled' : 'draft',
      platformOptions: body.platformOptions || {},
    })

    return this.toFlowResponse(flow)
  }

  async listFlows(token: TokenInfo) {
    const flows = await this.flowRepository.listByUserId(token.id)
    return flows.map(flow => this.toFlowResponse(flow))
  }

  async getFlow(token: TokenInfo, flowId: string) {
    const flow = await this.flowRepository.findLeanByUserIdAndId(token.id, flowId)
    if (!flow) {
      throw new UnprocessableEntityException(`Flow not found: ${flowId}`)
    }
    return this.toFlowResponse(flow)
  }

  async enqueueFlow(token: TokenInfo, flowId: string, scheduleAt?: Date) {
    const flow = await this.flowRepository.findDocByUserIdAndId(token.id, flowId)
    if (!flow) {
      throw new UnprocessableEntityException(`Flow not found: ${flowId}`)
    }

    const resolvedScheduleAt = scheduleAt || flow.scheduleAt

    const material = await this.assertContentAsset(token.id, flow.contentAssetId)
    const accounts = await this.assertAccounts(token.id, flow.targetAccountIds)
    const existingJobs = await this.publishRecordService.listByFlowId(flow.id)
    const existingByAccount = new Set(existingJobs.map(job => `${job.accountId}`))
    const publishTime = resolvedScheduleAt || new Date()
    const tasks: PublishRecord[] = []

    for (const account of accounts) {
      if (existingByAccount.has(account.id)) {
        continue
      }
      const created = await this.publishRecordService.createPublishRecord(
        this.buildPublishRecord(flow.id, publishTime, material, account, flow.platformOptions || {}),
      )
      tasks.push(created)
    }

    const nextStatus = publishTime.getTime() > Date.now() ? 'scheduled' : 'queued'
    await this.flowRepository.updateByUserIdAndId(token.id, flowId, {
      scheduleAt: resolvedScheduleAt,
      lastEnqueuedAt: new Date(),
      status: nextStatus,
    })

    if (publishTime.getTime() <= Date.now()) {
      for (const task of tasks) {
        await this.enqueueTask(task)
      }
    }

    return {
      flowId: flow.id,
      status: nextStatus,
      createdJobs: tasks.map(task => task.id),
    }
  }

  async getJobs(token: TokenInfo, query: {
    flowId?: string
    accountId?: string
    status?: number
  }) {
    const flowIds = new Set((await this.flowRepository.listIdsByUserId(token.id)).map(flow => String(flow._id)))
    const jobs = await this.publishRecordService.listPublishTasks({
      userId: token.id,
      flowId: query.flowId,
      accountId: query.accountId,
      status: query.status as PublishStatus | undefined,
    })
    return jobs
      .filter(job => job.flowId && flowIds.has(job.flowId))
      .map(job => this.toJobResponse(job))
  }

  async getJob(token: TokenInfo, jobId: string) {
    const job = await this.publishRecordService.getTaskInfoWithUserId(jobId, token.id)
    if (!job || !(await this.isFactoryFlowId(job.flowId || ''))) {
      throw new UnprocessableEntityException(`Job not found: ${jobId}`)
    }
    return this.toJobResponse(job)
  }

  async retryJob(token: TokenInfo, jobId: string) {
    const job = await this.publishRecordService.getTaskInfoWithUserId(jobId, token.id)
    if (!job || !(await this.isFactoryFlowId(job.flowId || ''))) {
      throw new UnprocessableEntityException(`Job not found: ${jobId}`)
    }

    await this.publishRecordService.updateById(job.id, {
      status: PublishStatus.WaitingForPublish,
      publishTime: new Date(),
      errorMsg: '',
      queued: false,
      inQueue: false,
      queueId: '',
      workLink: '',
    })

    const refreshed = await this.publishRecordService.getOneById(job.id)
    if (!refreshed) {
      throw new UnprocessableEntityException(`Job not found after retry reset: ${jobId}`)
    }
    await this.enqueueTask(refreshed)
    return this.toJobResponse(refreshed)
  }

  async enqueueDueTasks() {
    const dueTasks = await this.publishRecordService.listByTime(new Date())
    for (const task of dueTasks) {
      if (task.queued || !(await this.isFactoryFlowId(task.flowId || ''))) {
        continue
      }
      await this.enqueueTask(task)
    }
  }

  async verifyPublishingTasks() {
    const activeUserIds = await this.userRepository.listAllActiveIds()
    for (const userId of activeUserIds) {
      const jobs = await this.publishRecordService.listPublishTasks({
        userId,
        status: PublishStatus.PUBLISHING,
      })
      for (const job of jobs) {
        if (!(await this.isFactoryFlowId(job.flowId || ''))) {
          continue
        }
        const provider = this.getProvider(job.accountType)
        if (!provider) {
          continue
        }
        const result = await provider.verifyAndCompletePublish(job)
        if (!result.success) {
          continue
        }
        await this.publishRecordService.completeById(job, job.dataId || '', {
          workLink: result.workLink || '',
        })
        const completed = await this.publishRecordService.getOneById(job.id)
        if (completed) {
          await this.snapshotService.capturePublishedPost(completed)
          await this.updateFlowStatus(completed.flowId || '')
        }
      }
    }
  }

  async enqueueTask(task: PublishRecord) {
    const provider = this.getProvider(task.accountType)
    if (!provider) {
      throw new UnprocessableEntityException(`Unsupported account type: ${task.accountType}`)
    }

    const queued = await provider.enqueue(task)
    if (queued) {
      await this.publishRecordService.updateById(task.id, {
        queueId: task.id,
        queued: true,
        inQueue: false,
      })
    }
    return queued
  }

  async handleCompletion(taskId: string) {
    const task = await this.publishRecordService.getOneById(taskId)
    if (task && task.status === PublishStatus.PUBLISHED) {
      await this.snapshotService.capturePublishedPost(task)
      await this.updateFlowStatus(task.flowId || '')
    }
  }

  async updateFlowStatus(flowId: string) {
    if (!flowId) {
      return
    }

    const flow = await this.flowRepository.findDocById(flowId)
    if (!flow) {
      return
    }

    const jobs = await this.publishRecordService.listByFlowId(flowId)
    let nextStatus = flow.status
    if (jobs.length === 0) {
      nextStatus = 'draft'
    }
    else if (jobs.every(job => job.status === PublishStatus.PUBLISHED)) {
      nextStatus = 'completed'
    }
    else if (jobs.some(job => job.status === PublishStatus.FAILED)) {
      nextStatus = jobs.some(job => job.status === PublishStatus.PUBLISHED) ? 'partial' : 'failed'
    }
    else if (jobs.some(job => job.status === PublishStatus.PUBLISHING) || jobs.some(job => job.status === PublishStatus.WaitingForPublish)) {
      nextStatus = 'queued'
    }

    await this.flowRepository.updateById(flowId, { status: nextStatus })
  }

  getPublishTaskInfo(taskId: string) {
    return this.publishRecordService.getOneById(taskId)
  }

  updatePublishTaskStatus(taskId: string, newData: {
    errorMsg?: string
    status: PublishStatus
    publishTime?: Date
    queued?: boolean
    inQueue?: boolean
  }) {
    return this.publishRecordService.updateTaskStatus(taskId, newData)
  }

  markTaskAsPublishing(taskId: string, dataId: string, workLink?: string) {
    return this.publishRecordService.updateAsPublishing(taskId, dataId, workLink)
  }

  getProvider(accountType: AccountType) {
    return this.publishingProviders[accountType]
  }

  private async assertAccounts(userId: string, accountIds: string[]) {
    const accounts = await this.accountService.getAccountListByIdsOfUser(userId, accountIds)
    if (accounts.length !== accountIds.length) {
      throw new UnprocessableEntityException('Some target accounts were not found')
    }
    for (const account of accounts) {
      if (!FACTORY_SUPPORTED_ACCOUNT_TYPES.includes(account.type as (typeof FACTORY_SUPPORTED_ACCOUNT_TYPES)[number])) {
        throw new UnprocessableEntityException(`Unsupported account type: ${account.type}`)
      }
    }
    return accounts
  }

  private async assertContentAsset(userId: string, materialId: string) {
    const material = await this.materialService.getInfo(materialId)
    if (!material || material.userId !== userId) {
      throw new UnprocessableEntityException(`Content asset not found: ${materialId}`)
    }
    return material
  }

  private buildPublishRecord(
    flowId: string,
    publishTime: Date,
    material: Material,
    account: Account,
    platformOptions: Record<string, Record<string, unknown>>,
  ): Partial<PublishRecord> {
    const videoUrl = material.mediaList.find(media => media.type === 'video')?.url
    const imageUrls = videoUrl
      ? []
      : material.mediaList.filter(media => media.type === 'img').map(media => media.url)

    return {
      userId: account.userId,
      flowId,
      materialGroupId: material.groupId,
      materialId: material.id,
      title: material.title,
      desc: material.desc,
      accountId: account.id,
      accountType: account.type,
      uid: account.uid,
      publishTime,
      topics: material.topics || [],
      type: videoUrl ? PublishType.VIDEO : PublishType.ARTICLE,
      videoUrl,
      imgUrlList: imageUrls,
      coverUrl: material.coverUrl,
      option: this.buildPlatformOption(account.type, platformOptions),
      source: PublishRecordSource.PUBLISH,
      queued: false,
      inQueue: false,
      status: PublishStatus.WaitingForPublish,
    }
  }

  private buildPlatformOption(accountType: AccountType, platformOptions: Record<string, Record<string, unknown>>) {
    switch (accountType) {
      case AccountType.YOUTUBE:
        return {
          youtube: {
            categoryId: '22',
            privacyStatus: 'private',
            notifySubscribers: false,
            embeddable: true,
            selfDeclaredMadeForKids: false,
            ...(platformOptions['youtube'] || {}),
          },
        }
      case AccountType.TIKTOK:
        return {
          tiktok: {
            privacy_level: 'SELF_ONLY',
            ...(platformOptions['tiktok'] || {}),
          },
        }
      case AccountType.INSTAGRAM:
        return {
          instagram: {
            ...(platformOptions['instagram'] || {}),
          },
        }
      case AccountType.THREADS:
        return {
          threads: {
            ...(platformOptions['threads'] || {}),
          },
        }
      default:
        return platformOptions['x'] || platformOptions['twitter'] || {}
    }
  }

  private toFlowResponse(flow: FactoryFlow | (FactoryFlow & { _id?: unknown })) {
    return {
      id: flow.id,
      name: flow.name,
      contentAssetId: flow.contentAssetId,
      targetAccountIds: flow.targetAccountIds,
      scheduleAt: flow.scheduleAt,
      status: flow.status,
      lastEnqueuedAt: flow.lastEnqueuedAt,
      platformOptions: flow.platformOptions || {},
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    }
  }

  private toJobResponse(job: PublishRecord) {
    return {
      id: job.id,
      flowId: job.flowId,
      accountId: job.accountId,
      platform: job.accountType === AccountType.TWITTER ? 'x' : job.accountType,
      status: job.status,
      scheduledAt: job.publishTime,
      publishedAt: job.status === PublishStatus.PUBLISHED ? job.publishTime : null,
      remotePostId: job.dataId,
      workLink: job.workLink,
      errorMessage: job.errorMsg,
      metrics: {
        impressions: null,
        views: null,
        likes: null,
        comments: null,
        shares: null,
      },
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }
  }

  private async isFactoryFlowId(flowId: string) {
    if (!flowId) {
      return false
    }
    return await this.flowRepository.existsById(flowId)
  }
}
