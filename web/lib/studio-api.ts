import type { ZodType } from 'zod'
import { factoryFetch } from './factory-api'

export async function studioFetch<T>(
  path: string,
  schema: ZodType<T>,
  init: RequestInit = {},
  token?: string,
  apiBase?: string,
) {
  const data = await factoryFetch<unknown>(path, init, token, apiBase)
  return schema.parse(data)
}
