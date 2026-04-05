import { Test, TestingModule } from '@nestjs/testing'
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest'

vi.mock('@yikart/mongodb', () => ({
  UserRepository: class {},
  PublishStatus: {
    PUBLISHED: 1,
    PUBLISHING: 2,
    FAILED: -1,
    WaitingForPublish: 0
  },
  PublishType: { VIDEO: 1, ARTICLE: 2 },
  PublishRecordSource: { PUBLISH: 1 },
  WithTimestampSchema: class {},
  DEFAULT_SCHEMA_OPTIONS: {}
}))

import { FactoryPublishingService } from './factory-publishing.service'
import { FactoryFlowRepository } from '../storage/factory-flow.repository'
import { FactoryAccountService } from '../factory-account.service'
import { FactoryMaterialService } from '../factory-material.service'
import { FactoryPublishRecordService } from '../factory-publish-record.service'
import { FactorySnapshotService } from '../factory-snapshot.service'
import { UserRepository, PublishStatus } from '@yikart/mongodb'

describe('FactoryPublishingService', () => {
  let service: FactoryPublishingService
  let flowRepository: Mocked<FactoryFlowRepository>
  let publishRecordService: Mocked<FactoryPublishRecordService>

  beforeEach(async () => {
    const mockFlowRepository = {
      findDocById: vi.fn(),
      updateById: vi.fn(),
    }
    const mockPublishRecordService = {
      listByFlowId: vi.fn(),
    }

    flowRepository = mockFlowRepository as any
    publishRecordService = mockPublishRecordService as any
    
    service = new FactoryPublishingService(
      flowRepository,
      {} as any, // accountService
      {} as any, // materialService
      publishRecordService,
      {} as any, // snapshotService
      {} as any, // userRepository
      {} as any  // publishingProviders
    )
  })

  describe('updateFlowStatus', () => {
    const flowId = 'test-flow-id'

    it('early returns if flow is not found', async () => {
      flowRepository.findDocById.mockResolvedValueOnce(null)
      await service.updateFlowStatus(flowId)
      expect(publishRecordService.listByFlowId).not.toHaveBeenCalled()
    })

    it('sets status to draft when there are no jobs', async () => {
      flowRepository.findDocById.mockResolvedValueOnce({ status: 'scheduled' } as any)
      publishRecordService.listByFlowId.mockResolvedValueOnce([])

      await service.updateFlowStatus(flowId)
      expect(flowRepository.updateById).toHaveBeenCalledWith(flowId, { status: 'draft' })
    })

    it('sets status to completed when all jobs are PUBLISHED', async () => {
      flowRepository.findDocById.mockResolvedValueOnce({ status: 'queued' } as any)
      publishRecordService.listByFlowId.mockResolvedValueOnce([
        { status: PublishStatus.PUBLISHED },
        { status: PublishStatus.PUBLISHED },
      ] as any[])

      await service.updateFlowStatus(flowId)
      expect(flowRepository.updateById).toHaveBeenCalledWith(flowId, { status: 'completed' })
    })

    it('sets status to partial when some jobs are PUBLISHED and some FAILED', async () => {
      flowRepository.findDocById.mockResolvedValueOnce({ status: 'queued' } as any)
      publishRecordService.listByFlowId.mockResolvedValueOnce([
        { status: PublishStatus.PUBLISHED },
        { status: PublishStatus.FAILED },
      ] as any[])

      await service.updateFlowStatus(flowId)
      expect(flowRepository.updateById).toHaveBeenCalledWith(flowId, { status: 'partial' })
    })

    it('sets status to failed when jobs are FAILED and none are PUBLISHED', async () => {
      flowRepository.findDocById.mockResolvedValueOnce({ status: 'queued' } as any)
      publishRecordService.listByFlowId.mockResolvedValueOnce([
        { status: PublishStatus.FAILED },
        { status: PublishStatus.FAILED },
      ] as any[])

      await service.updateFlowStatus(flowId)
      expect(flowRepository.updateById).toHaveBeenCalledWith(flowId, { status: 'failed' })
    })

    it('sets status to queued when jobs are PUBLISHING or WaitingForPublish', async () => {
      flowRepository.findDocById.mockResolvedValueOnce({ status: 'scheduled' } as any)
      publishRecordService.listByFlowId.mockResolvedValueOnce([
        { status: PublishStatus.PUBLISHED },
        { status: PublishStatus.WaitingForPublish },
      ] as any[])

      await service.updateFlowStatus(flowId)
      expect(flowRepository.updateById).toHaveBeenCalledWith(flowId, { status: 'queued' })
    })

    it('retains the existing status if no conditions are matched', async () => {
      flowRepository.findDocById.mockResolvedValueOnce({ status: 'unknown-status' } as any)
      // For instance, status 999 (custom or unknown)
      publishRecordService.listByFlowId.mockResolvedValueOnce([
        { status: 999 },
      ] as any[])

      await service.updateFlowStatus(flowId)
      expect(flowRepository.updateById).toHaveBeenCalledWith(flowId, { status: 'unknown-status' })
    })
  })
})
