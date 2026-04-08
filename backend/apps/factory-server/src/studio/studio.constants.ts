import type {
  StudioPaidOfferPackage,
  StudioPublicPostPackage,
  StudioQualityCheck,
  StudioRejectReason,
  StudioReviewDecision,
} from './studio.contracts'

export const STUDIO_DEFAULT_PLATFORM = 'x'
export const STUDIO_DEFAULT_TIER = 'free_sns'
export const STUDIO_DEFAULT_MODEL = 'aniverse_v30.safetensors'
export const STUDIO_DEFAULT_WORKFLOW_VERSION = 'studio-v1'
export const STUDIO_DEFAULT_WORKFLOW_PATH = '../scripts/comfyui/workflow_api.json'
export const STUDIO_DEFAULT_WIDTH = 1024
export const STUDIO_DEFAULT_HEIGHT = 1536
export const STUDIO_REVIEW_REASON_LABELS: Record<StudioRejectReason, string> = {
  face_inconsistency: 'Face inconsistency',
  anatomy: 'Anatomy issue',
  ai_texture: 'AI texture issue',
  clothing_physics: 'Clothing physics issue',
  platform_risk: 'Platform risk',
  low_composition: 'Low composition quality',
  other: 'Other',
}

const REVIEW_QUALITY_LABELS = [
  ['face_consistency', 'Face consistency'],
  ['anatomy', 'Anatomy'],
  ['ai_texture', 'AI texture'],
  ['clothing_physics', 'Clothing physics'],
  ['platform_risk', 'Public safety'],
  ['composition', 'Composition'],
] as const

export function createPendingQualityChecks(): StudioQualityCheck[] {
  return REVIEW_QUALITY_LABELS.map(([code, label]) => ({
    code,
    label,
    status: 'manual_review_required',
    detail: null,
  }))
}

export function applyReviewToQualityChecks(
  current: StudioQualityCheck[],
  decision: StudioReviewDecision,
  rejectionReasons: StudioRejectReason[],
): StudioQualityCheck[] {
  if (decision === 'approve') {
    return current.map(item => ({
      ...item,
      status: 'accepted',
      detail: null,
    }))
  }

  const failedCodes = new Set<string>(rejectionReasons.map(mapRejectReasonToQualityCode))

  return current.map((item) => {
    if (failedCodes.has(item.code)) {
      return {
        ...item,
        status: 'failed',
        detail: 'Operator rejected this check.',
      }
    }

    return {
      ...item,
      status: decision === 'needs_regenerate' ? 'manual_review_required' : 'accepted',
      detail: null,
    }
  })
}

export function buildDefaultPublicPostChecklist(): StudioPublicPostPackage['checklist'] {
  return [
    'Confirm the crop and teaser stay public-safe.',
    'Paste the final Fanvue route URL before posting.',
    'Verify hashtags and CTA match the offer.',
    'Record public-side metrics after the post goes live.',
  ]
}

export function buildDefaultPaidOfferChecklist(): StudioPaidOfferPackage['checklist'] {
  return [
    'Confirm the Fanvue destination and pricing context.',
    'Check the teaser and body match the exported asset.',
    'Verify any premium-only notes stay off the public post.',
    'Record conversion and renewal signals after delivery.',
  ]
}

export function normalizeHashtag(tag: string) {
  const trimmed = tag.trim().replace(/^#/, '').replace(/\s+/g, '')
  return trimmed ? `#${trimmed}` : ''
}

function mapRejectReasonToQualityCode(reason: StudioRejectReason) {
  switch (reason) {
    case 'face_inconsistency':
      return 'face_consistency'
    case 'anatomy':
      return 'anatomy'
    case 'ai_texture':
      return 'ai_texture'
    case 'clothing_physics':
      return 'clothing_physics'
    case 'platform_risk':
      return 'platform_risk'
    case 'low_composition':
      return 'composition'
    case 'other':
      return 'composition'
    default:
      return 'composition'
  }
}
