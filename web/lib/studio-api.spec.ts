import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { studioFetch } = await import('./studio-api')

describe('studioFetch', () => {
  afterEach(() => {
    mockFetch.mockReset()
  })

  it('parses a valid schema response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: { id: 'asset-1' }, message: 'ok' }),
    })

    const result = await studioFetch('/studio/v1/test', z.object({ id: z.string() }))
    expect(result).toEqual({ id: 'asset-1' })
  })

  it('throws when the response does not match the schema', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: { id: 123 }, message: 'ok' }),
    })

    await expect(
      studioFetch('/studio/v1/test', z.object({ id: z.string() })),
    ).rejects.toThrow()
  })
})
