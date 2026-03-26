import { createZodDto } from '@yikart/common'
import z from 'zod'
import { factoryContentTypeSchema } from './factory.constants'

const mediaRefSchema = z.object({
  url: z.string().min(1),
  type: z.enum(['image', 'video']),
  thumbUrl: z.string().optional(),
  mediaId: z.string().optional(),
})

export const createFactoryContentAssetSchema = z.object({
  title: z.string().min(1),
  body: z.string().default(''),
  topics: z.array(z.string()).default([]),
  contentType: factoryContentTypeSchema.default('text'),
  coverUrl: z.string().optional(),
  mediaRefs: z.array(mediaRefSchema).default([]),
})

export class CreateFactoryContentAssetDto extends createZodDto(createFactoryContentAssetSchema) {}
