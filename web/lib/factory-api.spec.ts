import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// We need to import after mocking
const { factoryFetch } = await import('./factory-api')

describe('factoryFetch', () => {
  afterEach(() => {
    mockFetch.mockReset()
  })

  it('unwraps a successful envelope response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: { id: '123' }, message: 'ok' }),
    })

    const result = await factoryFetch('/test')
    expect(result).toEqual({ id: '123' })
  })

  it('throws on non-zero envelope code', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 1001, data: null, message: 'Something went wrong' }),
    })

    await expect(factoryFetch('/test')).rejects.toThrow('Something went wrong')
  })

  it('throws on non-ok HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    })

    await expect(factoryFetch('/test')).rejects.toThrow('Internal server error')
  })

  it('passes through non-envelope responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [1, 2, 3],
    })

    const result = await factoryFetch('/test')
    expect(result).toEqual([1, 2, 3])
  })

  it('includes authorization header when token is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: {}, message: 'ok' }),
    })

    await factoryFetch('/test', {}, 'my-token', 'http://localhost:3012/api')

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3012/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      }),
    )
  })

  it('does not include authorization header when token is undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: {}, message: 'ok' }),
    })

    await factoryFetch('/test')

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.headers).not.toHaveProperty('Authorization')
  })
})
