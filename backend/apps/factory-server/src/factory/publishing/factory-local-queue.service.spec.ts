import { Test, TestingModule } from '@nestjs/testing'
import { ModuleRef } from '@nestjs/core'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('@yikart/mongodb', () => ({
  UserRepository: class {},
  PublishStatus: {
    PUBLISHED: 1,
    PUBLISHING: 2,
    FAILED: -1,
    WaitingForPublish: 0
  },
  PublishType: { VIDEO: 1, ARTICLE: 2 },
  PublishRecordSource: { PUBLISH: 1 }
}))

import { FactoryLocalQueueService } from './factory-local-queue.service'
import { QueueName } from '@yikart/aitoearn-queue'
import { FactoryImmediatePublishConsumer } from './factory-immediate-publish.consumer'
import { FactoryFinalizePublishConsumer } from './factory-finalize-publish.consumer'
import { FactoryPublishingUnrecoverableError } from './factory-publishing.exception'
import { FactoryPublishingService } from './factory-publishing.service'

describe('FactoryLocalQueueService', () => {
  let service: FactoryLocalQueueService
  let moduleRef: ModuleRef

  const mockImmediateConsumer = {
    process: vi.fn(),
    handleMaxRetries: vi.fn(),
  }

  const mockFinalizeConsumer = {
    process: vi.fn(),
    handleMaxRetries: vi.fn(),
  }

  const mockPublishingService = {
    updatePublishTaskStatus: vi.fn(),
  }

  beforeEach(async () => {
    vi.useFakeTimers()
    
    // Clear mocks
    vi.clearAllMocks()

    const mockModuleRef = {
      get: vi.fn((type, options) => {
        if (type === FactoryImmediatePublishConsumer) return mockImmediateConsumer
        if (type === FactoryFinalizePublishConsumer) return mockFinalizeConsumer
        if (type === FactoryPublishingService) return mockPublishingService
        return null
      }),
    }

    service = new FactoryLocalQueueService(mockModuleRef as any)
    moduleRef = mockModuleRef as any
  })

  afterEach(() => {
    service.onModuleDestroy()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('runs job immediately when no delay', async () => {
    const data = { jobId: 'test-job', time: Date.now() }
    await service.addPostPublishJob(data)

    expect(mockImmediateConsumer.process).not.toHaveBeenCalled()
    await vi.runAllTimersAsync()
    
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(1)
    expect(mockImmediateConsumer.process).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-job',
      data,
    }))
  })

  it('delays job processing based on options.delay', async () => {
    const data = { jobId: 'job-delay', time: Date.now() }
    await service.addPostPublishJob(data, { delay: 5000 })

    await vi.advanceTimersByTimeAsync(4900)
    expect(mockImmediateConsumer.process).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(1)
  })

  it('retries job on regular error depending on options.attempts', async () => {
    const data = { jobId: 'job-retry', time: Date.now() }
    
    mockImmediateConsumer.process
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce(true)

    await service.addPostPublishJob(data, { attempts: 3, backoff: 1000 })

    // First attempt
    await vi.runOnlyPendingTimersAsync()
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(1)

    // Second attempt after 1000ms backoff
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(2)

    // Third attempt
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(3)
    
    expect(mockImmediateConsumer.handleMaxRetries).not.toHaveBeenCalled()
  })

  it('calls handleMaxRetries after exceeding attempts', async () => {
    const data = { jobId: 'job-fail', time: Date.now() }
    const error = new Error('persistent fail')
    mockImmediateConsumer.process.mockRejectedValue(error)

    await service.addPostPublishJob(data, { attempts: 2, backoff: 500 })

    // 1st attempt
    await vi.runOnlyPendingTimersAsync()
    
    // 2nd attempt
    await vi.advanceTimersByTimeAsync(500)

    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(2)
    expect(mockImmediateConsumer.handleMaxRetries).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-fail' }),
      error,
    )
  })

  it('bails out and calls handleMaxRetries immediately on FactoryPublishingUnrecoverableError', async () => {
    const data = { jobId: 'job-fatal', time: Date.now() }
    const fatalError = new FactoryPublishingUnrecoverableError('fatal error')
    mockImmediateConsumer.process.mockRejectedValue(fatalError)

    // Give it 5 attempts
    await service.addPostPublishJob(data, { attempts: 5, backoff: { type: 'fixed', delay: 1000 } })

    await vi.runOnlyPendingTimersAsync()
    
    // Should not retry despite attempts: 5
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(1)
    expect(mockImmediateConsumer.handleMaxRetries).toHaveBeenCalledTimes(1)
    expect(mockImmediateConsumer.handleMaxRetries).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-fatal' }),
      fatalError,
    )
  })

  it('applies exponential backoff correctly', async () => {
    const data = { jobId: 'job-exp', time: Date.now() }
    mockImmediateConsumer.process.mockRejectedValue(new Error('fail'))

    await service.addPostPublishJob(data, { attempts: 4, backoff: { type: 'exponential', delay: 1000 } })

    // Attempt 1 -> 0ms
    await vi.runOnlyPendingTimersAsync()

    // Attempt 2 -> delay * 2^0 = 1000ms
    await vi.advanceTimersByTimeAsync(999)
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(2)

    // Attempt 3 -> delay * 2^1 = 2000ms
    await vi.advanceTimersByTimeAsync(1999)
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockImmediateConsumer.process).toHaveBeenCalledTimes(3)
  })
})
