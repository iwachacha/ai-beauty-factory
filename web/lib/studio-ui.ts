import type {
  StudioAssetSurfaceFit,
  StudioGenerationRun,
  StudioGeneratedAsset,
  StudioRejectReason,
} from './studio-contracts'

export const studioTierOptions = [
  { value: 'free_sns', label: 'Free SNS' },
  { value: 'subscriber', label: 'Subscriber' },
  { value: 'premium', label: 'Premium' },
] as const

export const studioEntityStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
] as const

export const studioReviewReasonOptions: Array<{ value: StudioRejectReason, label: string }> = [
  { value: 'face_inconsistency', label: 'Face inconsistency' },
  { value: 'anatomy', label: 'Anatomy issue' },
  { value: 'ai_texture', label: 'AI texture issue' },
  { value: 'clothing_physics', label: 'Clothing physics issue' },
  { value: 'platform_risk', label: 'Platform risk' },
  { value: 'low_composition', label: 'Low composition quality' },
  { value: 'other', label: 'Other' },
]

export const studioSurfaceFitOptions: Array<{ value: StudioAssetSurfaceFit, label: string, description: string }> = [
  { value: 'public_safe', label: 'Public safe', description: 'Allowed to become an X teaser post.' },
  { value: 'paid_only', label: 'Paid only', description: 'Keep this asset off the public feed and reserve it for Fanvue.' },
]

export const studioGenerationStatusLabels: Record<StudioGenerationRun['status'], string> = {
  queued: 'Queued',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
}

export const studioReviewStatusLabels: Record<StudioGeneratedAsset['reviewStatus'], string> = {
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  needs_regenerate: 'Needs regenerate',
}

export const studioSurfaceFitLabels: Record<StudioAssetSurfaceFit, string> = {
  public_safe: 'Public safe',
  paid_only: 'Paid only',
}

export function splitCommaSeparated(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export function splitLineSeparated(value: string) {
  return value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatCompactDateTime(value?: string | null) {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('ja-JP').format(value)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function statusChipStyle(tone: 'default' | 'success' | 'danger' = 'default') {
  const background = tone === 'success'
    ? 'rgba(31, 106, 75, 0.14)'
    : tone === 'danger'
      ? 'rgba(160, 53, 45, 0.14)'
      : 'rgba(154, 77, 31, 0.12)'
  const color = tone === 'success'
    ? 'var(--success)'
    : tone === 'danger'
      ? 'var(--danger)'
      : 'var(--brand)'

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 999,
    background,
    color,
    fontSize: 13,
    fontWeight: 700,
  } as const
}

export function getReviewTone(status: StudioGeneratedAsset['reviewStatus']): 'default' | 'success' | 'danger' {
  if (status === 'approved') {
    return 'success'
  }
  if (status === 'rejected') {
    return 'danger'
  }
  return 'default'
}
