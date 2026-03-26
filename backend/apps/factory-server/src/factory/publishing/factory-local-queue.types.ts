import type { JobsOptions } from 'bullmq'

export interface FactoryLocalQueueJob<T> {
  id: string
  name: string
  data: T
  attemptsMade: number
  opts: JobsOptions
}
