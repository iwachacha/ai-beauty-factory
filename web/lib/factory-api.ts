export interface FactorySession {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

interface FactoryApiEnvelope<T> {
  code: number
  data: T
  message: string
}

export function getDefaultApiBase() {
  return process.env.NEXT_PUBLIC_FACTORY_API_URL || 'http://localhost:3012/api'
}

export async function factoryFetch<T>(path: string, init: RequestInit = {}, token?: string, apiBase = getDefaultApiBase()): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }

  const payload = await response.json() as FactoryApiEnvelope<T> | T
  if (typeof payload === 'object' && payload !== null && 'code' in payload && 'message' in payload) {
    if (payload.code !== 0) {
      throw new Error(payload.message || `Request failed: ${payload.code}`)
    }
    return payload.data
  }

  return payload
}
