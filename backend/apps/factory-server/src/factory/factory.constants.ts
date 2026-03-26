import { AccountType } from '@yikart/common'
import z from 'zod'

export const FACTORY_SUPPORTED_ACCOUNT_TYPES = [
  AccountType.TWITTER,
  AccountType.INSTAGRAM,
  AccountType.THREADS,
  AccountType.TIKTOK,
  AccountType.YOUTUBE,
] as const

export const FACTORY_PLATFORM_ALIASES = {
  x: AccountType.TWITTER,
  twitter: AccountType.TWITTER,
  instagram: AccountType.INSTAGRAM,
  threads: AccountType.THREADS,
  tiktok: AccountType.TIKTOK,
  youtube: AccountType.YOUTUBE,
} as const

export const factoryPlatformSchema = z.enum([
  'x',
  'twitter',
  'instagram',
  'threads',
  'tiktok',
  'youtube',
])

export const factoryContentTypeSchema = z.enum([
  'text',
  'image',
  'video',
  'mixed',
])

export const factoryFlowStatusSchema = z.enum([
  'draft',
  'scheduled',
  'queued',
  'partial',
  'completed',
  'failed',
])

export type FactoryContentType = z.infer<typeof factoryContentTypeSchema>
export type FactoryFlowStatus = z.infer<typeof factoryFlowStatusSchema>
