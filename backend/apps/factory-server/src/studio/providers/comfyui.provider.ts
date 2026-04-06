import type { StudioGenerationProvider, StudioGenerationProviderRequest, StudioGenerationProviderResult } from './generation-provider.interface'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  STUDIO_DEFAULT_HEIGHT,
  STUDIO_DEFAULT_MODEL,
  STUDIO_DEFAULT_WIDTH,
  STUDIO_DEFAULT_WORKFLOW_PATH,
} from '../studio.constants'

interface ComfyWorkflowNode {
  inputs?: Record<string, unknown>
}

type ComfyWorkflow = Record<string, ComfyWorkflowNode>

@Injectable()
export class ComfyUiGenerationProvider implements StudioGenerationProvider {
  async generate(request: StudioGenerationProviderRequest): Promise<StudioGenerationProviderResult> {
    const workflow = await this.loadWorkflow()
    this.applyPrompt(workflow, request)

    const promptResponse = await this.fetchJson<{ prompt_id?: string }>('/prompt', {
      method: 'POST',
      body: JSON.stringify({
        prompt: workflow,
        client_id: `studio-${Date.now()}`,
      }),
    })

    if (!promptResponse.prompt_id) {
      throw new InternalServerErrorException('ComfyUI prompt queue failed')
    }

    const history = await this.waitForHistory(promptResponse.prompt_id)
    const images = this.extractImages(history, promptResponse.prompt_id)
    if (images.length === 0) {
      throw new InternalServerErrorException('ComfyUI returned no images')
    }

    return {
      providerJobId: promptResponse.prompt_id,
      images,
    }
  }

  private async loadWorkflow() {
    const workflowPath = process.env['COMFYUI_WORKFLOW_PATH']
      ? resolve(process.cwd(), process.env['COMFYUI_WORKFLOW_PATH'])
      : resolve(process.cwd(), STUDIO_DEFAULT_WORKFLOW_PATH)
    const raw = await readFile(workflowPath, 'utf8')
    return JSON.parse(raw) as ComfyWorkflow
  }

  private applyPrompt(workflow: ComfyWorkflow, request: StudioGenerationProviderRequest) {
    const positiveNode = workflow['6']
    const negativeNode = workflow['7']
    const checkpointNode = workflow['4']
    const latentNode = workflow['5']
    const samplerNode = workflow['3']

    if (!positiveNode?.inputs || !negativeNode?.inputs || !checkpointNode?.inputs || !latentNode?.inputs || !samplerNode?.inputs) {
      throw new InternalServerErrorException('Invalid ComfyUI workflow template')
    }

    positiveNode.inputs['text'] = request.positivePrompt
    negativeNode.inputs['text'] = request.negativePrompt
    checkpointNode.inputs['ckpt_name'] = request.model || STUDIO_DEFAULT_MODEL
    latentNode.inputs['width'] = request.width || STUDIO_DEFAULT_WIDTH
    latentNode.inputs['height'] = request.height || STUDIO_DEFAULT_HEIGHT
    samplerNode.inputs['seed'] = request.seed
  }

  private async waitForHistory(promptId: string) {
    const maxAttempts = 20
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const history = await this.fetchJson<Record<string, { outputs?: Record<string, { images?: Array<{ filename: string, subfolder: string, type: string }> }> }>>(`/history/${promptId}`)
      if (history[promptId]) {
        return history
      }
      await new Promise(resolvePromise => setTimeout(resolvePromise, 500))
    }

    throw new InternalServerErrorException('ComfyUI history polling timed out')
  }

  private extractImages(history: Record<string, { outputs?: Record<string, { images?: Array<{ filename: string, subfolder: string, type: string }> }> }>, promptId: string) {
    const outputs = history[promptId]?.outputs || {}
    const items = Object.values(outputs).flatMap(output => output.images || [])
    return items.map(image => ({
      assetId: `${promptId}:${image.filename}`,
      previewUrl: `${this.baseUrl()}/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder || '')}&type=${encodeURIComponent(image.type || 'output')}`,
    }))
  }

  private async fetchJson<T>(path: string, init?: RequestInit) {
    const response = await fetch(`${this.baseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })

    if (!response.ok) {
      throw new InternalServerErrorException(`ComfyUI request failed: ${response.status}`)
    }

    return await response.json() as T
  }

  private baseUrl() {
    const server = process.env['COMFYUI_SERVER_ADDRESS'] || '127.0.0.1:8188'
    return server.startsWith('http://') || server.startsWith('https://') ? server : `http://${server}`
  }
}
