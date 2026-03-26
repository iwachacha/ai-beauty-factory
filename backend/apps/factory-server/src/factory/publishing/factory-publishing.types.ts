import { PublishRecord, PublishStatus } from '@yikart/mongodb'

export interface FactoryPublishingProvider {
  enqueue: (task: PublishRecord) => Promise<boolean>
  immediatePublish: (task: PublishRecord) => Promise<{
    status: PublishStatus
    postId?: string
    permalink?: string
    extra?: Record<string, unknown>
  }>
  finalizePublish: (task: PublishRecord) => Promise<{
    status: PublishStatus
    postId?: string
    permalink?: string
    extra?: Record<string, unknown>
  } | void>
  verifyAndCompletePublish: (task: PublishRecord) => Promise<{
    success: boolean
    workLink?: string
    errorMsg?: string
  }>
  completePublishTask: (
    task: PublishRecord,
    postId: string,
    data?: {
      workLink: string
      dataOption?: Record<string, unknown>
    },
  ) => Promise<void>
}

export type FactoryPublishingExceptionLike = Error & {
  retryable?: boolean
  details?: Record<string, unknown>
}

export type FactorySocialMediaErrorLike = Error & {
  status?: number
  isNetworkError?: boolean
}
