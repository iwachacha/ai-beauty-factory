import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComfyUiGenerationProvider } from './comfyui.provider'

describe('comfyUiGenerationProvider', () => {
  const provider = new ComfyUiGenerationProvider()
  const workflowDir = resolve(process.cwd(), 'tmp', 'studio-tests')
  const workflowPath = resolve(workflowDir, 'workflow.json')
  const fetchMock = vi.fn()

  beforeEach(async () => {
    vi.stubGlobal('fetch', fetchMock)
    await mkdir(workflowDir, { recursive: true })
    await writeFile(workflowPath, JSON.stringify({
      3: { inputs: { seed: 0 } },
      4: { inputs: { ckpt_name: 'base' } },
      5: { inputs: { width: 512, height: 512 } },
      6: { inputs: { text: 'positive' } },
      7: { inputs: { text: 'negative' } },
    }), 'utf8')
    process.env['COMFYUI_WORKFLOW_PATH'] = workflowPath
    process.env['COMFYUI_SERVER_ADDRESS'] = 'http://localhost:8188'
  })

  afterEach(async () => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    delete process.env['COMFYUI_WORKFLOW_PATH']
    delete process.env['COMFYUI_SERVER_ADDRESS']
    await rm(workflowDir, { recursive: true, force: true })
  })

  it('returns images when queue and history succeed', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompt_id: 'job-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'job-1': {
            outputs: {
              9: {
                images: [{ filename: 'output.png', subfolder: '', type: 'output' }],
              },
            },
          },
        }),
      })

    const result = await provider.generate({
      positivePrompt: 'positive',
      negativePrompt: 'negative',
      workflowVersion: 'studio-v1',
      seed: 123,
      model: 'model.safetensors',
      width: 1024,
      height: 1536,
    })

    expect(result.providerJobId).toBe('job-1')
    expect(result.images[0].previewUrl).toContain('/view?filename=output.png')
  })

  it('fails when history never completes', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompt_id: 'job-2' }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

    await expect(provider.generate({
      positivePrompt: 'positive',
      negativePrompt: 'negative',
      workflowVersion: 'studio-v1',
      seed: 123,
      model: 'model.safetensors',
      width: 1024,
      height: 1536,
    })).rejects.toThrow('ComfyUI history polling timed out')
  }, 15_000)
})
