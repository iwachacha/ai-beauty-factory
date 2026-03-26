import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { PublishRecord, PublishRecordRepository, PublishStatus, PublishType } from '@yikart/mongodb'
import { UpdateQuery } from 'mongoose'
import { FactoryMaterialService } from './factory-material.service'

@Injectable()
export class FactoryPublishRecordService {
  private readonly logger = new Logger(FactoryPublishRecordService.name)

  constructor(
    private readonly publishRecordRepository: PublishRecordRepository,
    private readonly materialService: FactoryMaterialService,
  ) {}

  async createPublishRecord(data: Partial<PublishRecord>) {
    return await this.publishRecordRepository.create(data)
  }

  async updateById(id: string, update: UpdateQuery<PublishRecord>) {
    return await this.publishRecordRepository.updateById(id, update)
  }

  async getOneById(id: string) {
    return await this.publishRecordRepository.findOneById(id)
  }

  async getOneByData(dataId: string, uid: string) {
    return await this.publishRecordRepository.findOneByData(dataId, uid)
  }

  async getTaskInfoWithUserId(id: string, userId: string) {
    return await this.publishRecordRepository.getPublishTaskInfoWithUserId(id, userId)
  }

  async listByTime(end: Date) {
    return await this.publishRecordRepository.getPublishTaskListByTime(end)
  }

  async listByFlowId(flowId: string) {
    return await this.publishRecordRepository.getPublishTaskListByFlowId(flowId)
  }

  async listPublishTasks(query: {
    userId: string
    flowId?: string
    accountId?: string
    accountType?: AccountType
    status?: PublishStatus
    type?: PublishType
    time?: [Date?, Date?, ...unknown[]]
    uid?: string
  }) {
    return await this.publishRecordRepository.getPublishTasks(query)
  }

  async updateTaskStatus(
    id: string,
    newData: {
      errorMsg?: string
      status: PublishStatus
      publishTime?: Date
      queued?: boolean
      inQueue?: boolean
    },
  ) {
    return await this.publishRecordRepository.updatePublishTaskStatus(id, newData)
  }

  async updateAsPublishing(id: string, dataId: string, workLink?: string) {
    return await this.publishRecordRepository.updateAsPublishing(id, dataId, workLink)
  }

  async updateQueueId(id: string, queueId: string, queued?: boolean) {
    return await this.publishRecordRepository.updateQueueId(id, queueId, queued)
  }

  async failById(id: string, errMsg: string) {
    return await this.publishRecordRepository.fail(id, errMsg)
  }

  async updateStatusById(id: string, status: PublishStatus, msg?: string) {
    return await this.publishRecordRepository.updateStatus(id, status, msg)
  }

  async completeById(
    data: PublishRecord,
    dataId: string,
    newData?: {
      workLink: string
      dataOption?: Record<string, unknown>
    },
  ) {
    if (data.materialId) {
      try {
        await this.materialService.addUseCount(data.materialId)
      }
      catch (error) {
        this.logger.warn(`Failed to increase material use count for ${data.materialId}: ${(error as Error).message}`)
      }
    }

    return await this.publishRecordRepository.complete(data.id, dataId, newData)
  }
}
