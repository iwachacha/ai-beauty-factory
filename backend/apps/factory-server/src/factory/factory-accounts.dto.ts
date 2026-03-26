import { createZodDto } from '@yikart/common'
import z from 'zod'
import { factoryPlatformSchema } from './factory.constants'

export const factoryConnectAccountSchema = z.object({
  groupId: z.string().optional(),
})

export class FactoryConnectAccountDto extends createZodDto(factoryConnectAccountSchema) {}

export const factoryAccountListQuerySchema = z.object({
  platform: factoryPlatformSchema.optional(),
})

export class FactoryAccountListQueryDto extends createZodDto(factoryAccountListQuerySchema) {}
