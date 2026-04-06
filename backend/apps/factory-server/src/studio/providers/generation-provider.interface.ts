export interface StudioGenerationImageResult {
  assetId: string
  previewUrl: string
}

export interface StudioGenerationProviderRequest {
  positivePrompt: string
  negativePrompt: string
  workflowVersion: string
  seed: number
  model: string
  width: number
  height: number
}

export interface StudioGenerationProviderResult {
  providerJobId: string
  images: StudioGenerationImageResult[]
}

export interface StudioGenerationProvider {
  generate: (request: StudioGenerationProviderRequest) => Promise<StudioGenerationProviderResult>
}
