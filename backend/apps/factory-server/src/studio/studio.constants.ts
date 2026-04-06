import type {
  StudioPublishPackage,
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
  face_inconsistency: '顔の一貫性',
  anatomy: '解剖学的破綻',
  ai_texture: 'AI感の強い質感',
  clothing_physics: '衣服の物理破綻',
  platform_risk: 'プラットフォーム規約リスク',
  low_composition: '構図の弱さ',
  other: 'その他',
}

const REVIEW_QUALITY_LABELS = [
  ['face_consistency', '顔の一貫性'],
  ['anatomy', '解剖学'],
  ['ai_texture', 'AI感の排除'],
  ['clothing_physics', '衣服の自然さ'],
  ['platform_risk', '規約適合性'],
  ['composition', '構図の強さ'],
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
        detail: '要再調整',
      }
    }

    return {
      ...item,
      status: decision === 'needs_regenerate' ? 'manual_review_required' : 'accepted',
      detail: null,
    }
  })
}

export function buildDefaultPublishChecklist(): StudioPublishPackage['checklist'] {
  return [
    '画像プレビューを確認する',
    '最終キャプションをX投稿画面へ反映する',
    '投稿後にURLを記録する',
    '初期メトリクスをInsightsへ手入力する',
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
