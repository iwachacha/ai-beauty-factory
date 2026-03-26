import { createZodDto } from '@yikart/common'
import z from 'zod'

export const createFactoryFlowSchema = z.object({
  name: z.string().min(1),
  contentAssetId: z.string().min(1),
  targetAccountIds: z.array(z.string()).min(1),
  scheduleAt: z.coerce.date().optional(),
  platformOptions: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
})

export class CreateFactoryFlowDto extends createZodDto(createFactoryFlowSchema) {}

export const enqueueFactoryFlowSchema = z.object({
  scheduleAt: z.coerce.date().optional(),
})

export class EnqueueFactoryFlowDto extends createZodDto(enqueueFactoryFlowSchema) {}

export const factoryJobsQuerySchema = z.object({
  flowId: z.string().optional(),
  accountId: z.string().optional(),
  status: z.coerce.number().optional(),
})

export class FactoryJobsQueryDto extends createZodDto(factoryJobsQuerySchema) {}

export const createFactoryApiKeySchema = z.object({
  name: z.string().min(1),
})

export class CreateFactoryApiKeyDto extends createZodDto(createFactoryApiKeySchema) {}
