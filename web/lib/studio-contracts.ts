import z from 'zod'

// Mirror of the Studio backend contract.
// Keep this file in sync with backend/apps/factory-server/src/studio/studio.contracts.ts

export const studioPlatformSchema = z.enum(['x'])
export const studioTierSchema = z.enum(['free_sns', 'subscriber', 'premium'])
export const studioEntityStatusSchema = z.enum(['draft', 'active', 'archived'])
export const studioGenerationStatusSchema = z.enum(['queued', 'running', 'completed', 'failed'])
export const studioReviewStatusSchema = z.enum(['pending_review', 'approved', 'rejected', 'needs_regenerate'])
export const studioDraftStatusSchema = z.enum(['draft', 'ready'])
export const studioPublishPackageStatusSchema = z.enum(['prepared', 'published'])
export const studioReviewDecisionSchema = z.enum(['approve', 'reject', 'needs_regenerate'])
export const studioQualityCheckStatusSchema = z.enum(['manual_review_required', 'accepted', 'failed'])
export const studioChannelAccountStatusSchema = z.enum(['connected', 'needs_reconnect'])
export const studioRejectReasonSchema = z.enum([
  'face_inconsistency',
  'anatomy',
  'ai_texture',
  'clothing_physics',
  'platform_risk',
  'low_composition',
  'other',
])

export const isoDateStringSchema = z.string().datetime({ offset: true })

const studioTimestampSchema = z.object({
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
})

export const studioCredentialSummarySchema = z.object({
  nickname: z.string(),
  handle: z.string(),
  followers: z.number().int().nonnegative(),
  profileUrl: z.string().url().optional().nullable(),
  lastSyncedAt: isoDateStringSchema.optional().nullable(),
})

export const studioChannelAccountSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  accountId: z.string(),
  platform: studioPlatformSchema,
  status: studioChannelAccountStatusSchema,
  isActive: z.boolean(),
  credentialSummary: studioCredentialSummarySchema,
})

export const studioAvailableAccountSchema = z.object({
  accountId: z.string(),
  platform: studioPlatformSchema,
  nickname: z.string(),
  handle: z.string(),
  followers: z.number().int().nonnegative(),
  status: z.number().int(),
})

export const studioChannelAccountStateSchema = z.object({
  activeAccountId: z.string().nullable(),
  items: z.array(studioChannelAccountSchema),
  availableAccounts: z.array(studioAvailableAccountSchema),
})

export const studioCharacterProfileSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  code: z.string(),
  displayName: z.string(),
  personaSummary: z.string(),
  nationality: z.string(),
  profession: z.string(),
  styleNotes: z.array(z.string()),
  defaultTier: studioTierSchema,
  faceReferenceAssetIds: z.array(z.string()),
  status: studioEntityStatusSchema,
})

export const studioPromptTemplateSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  code: z.string(),
  scene: z.string(),
  intent: z.string(),
  outfitTags: z.array(z.string()),
  fetishTags: z.array(z.string()),
  tierSuitability: z.array(studioTierSchema),
  positiveBlocks: z.array(z.string()),
  negativeBlocks: z.array(z.string()),
  status: studioEntityStatusSchema,
})

export const studioPromptSnapshotSchema = z.object({
  positivePrompt: z.string(),
  negativePrompt: z.string(),
  positiveBlocks: z.array(z.string()),
  negativeBlocks: z.array(z.string()),
  characterSummary: z.string(),
  templateSummary: z.string(),
})

export const studioParameterSnapshotSchema = z.object({
  seed: z.number().int().nonnegative(),
  model: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  workflowVersion: z.string(),
  faceReferenceAssetIds: z.array(z.string()),
  serverAddress: z.string(),
})

export const studioQualityCheckSchema = z.object({
  code: z.string(),
  label: z.string(),
  status: studioQualityCheckStatusSchema,
  detail: z.string().optional().nullable(),
})

export const studioGenerationRunSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  characterId: z.string(),
  templateId: z.string(),
  targetPlatform: studioPlatformSchema,
  targetTier: studioTierSchema,
  workflowVersion: z.string(),
  promptSnapshot: studioPromptSnapshotSchema,
  parameterSnapshot: studioParameterSnapshotSchema,
  status: studioGenerationStatusSchema,
  error: z.string().nullable(),
  providerJobId: z.string().nullable(),
  startedAt: isoDateStringSchema.optional().nullable(),
  completedAt: isoDateStringSchema.optional().nullable(),
})

export const studioGeneratedAssetSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  generationRunId: z.string(),
  assetId: z.string(),
  previewUrl: z.string().url(),
  reviewStatus: studioReviewStatusSchema,
  reviewScore: z.number().min(0).max(100).nullable(),
  rejectionReasons: z.array(studioRejectReasonSchema),
  operatorNote: z.string(),
  qualityChecks: z.array(studioQualityCheckSchema),
})

export const studioContentDraftSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  generatedAssetId: z.string(),
  captionOptions: z.array(z.string()),
  hashtags: z.array(z.string()),
  cta: z.string(),
  publishNote: z.string(),
  status: studioDraftStatusSchema,
})

export const studioAssetRefSchema = z.object({
  assetId: z.string(),
  previewUrl: z.string().url(),
})

export const studioPublishPackageSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  contentDraftId: z.string(),
  channelAccountId: z.string(),
  finalCaption: z.string(),
  assetRefs: z.array(studioAssetRefSchema),
  checklist: z.array(z.string()),
  status: studioPublishPackageStatusSchema,
  exportedAt: isoDateStringSchema,
})

export const studioManualMetricsSchema = z.object({
  impressions: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  reposts: z.number().int().nonnegative(),
  replies: z.number().int().nonnegative(),
  bookmarks: z.number().int().nonnegative(),
  profileVisits: z.number().int().nonnegative(),
  linkClicks: z.number().int().nonnegative(),
})

export const studioPublishedPostSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  publishPackageId: z.string(),
  platformPostUrl: z.string().url(),
  publishedAt: isoDateStringSchema,
  manualMetrics: studioManualMetricsSchema,
  operatorMemo: z.string(),
})

export const studioInsightsResponseSchema = z.object({
  summary: z.object({
    totalPosts: z.number().int().nonnegative(),
    totalImpressions: z.number().int().nonnegative(),
    totalLikes: z.number().int().nonnegative(),
    totalReposts: z.number().int().nonnegative(),
    totalReplies: z.number().int().nonnegative(),
    totalBookmarks: z.number().int().nonnegative(),
    totalProfileVisits: z.number().int().nonnegative(),
    totalLinkClicks: z.number().int().nonnegative(),
  }),
  items: z.array(studioPublishedPostSchema),
  pendingPublishPackages: z.array(studioPublishPackageSchema),
})

export const createStudioChannelAccountRequestSchema = z.object({
  accountId: z.string().min(1),
})

export const createStudioCharacterRequestSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  displayName: z.string().min(1),
  personaSummary: z.string().min(1),
  nationality: z.string().min(1),
  profession: z.string().min(1),
  styleNotes: z.array(z.string()).default([]),
  defaultTier: studioTierSchema.default('free_sns'),
  faceReferenceAssetIds: z.array(z.string()).default([]),
  status: studioEntityStatusSchema.default('active'),
})

export const createStudioTemplateRequestSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  scene: z.string().min(1),
  intent: z.string().min(1),
  outfitTags: z.array(z.string()).default([]),
  fetishTags: z.array(z.string()).default([]),
  tierSuitability: z.array(studioTierSchema).default(['free_sns']),
  positiveBlocks: z.array(z.string()).min(1),
  negativeBlocks: z.array(z.string()).default([]),
  status: studioEntityStatusSchema.default('active'),
})

export const createStudioGenerationRunRequestSchema = z.object({
  characterId: z.string().min(1),
  templateId: z.string().min(1),
  targetPlatform: studioPlatformSchema.default('x'),
  targetTier: studioTierSchema.default('free_sns'),
})

export const reviewStudioGeneratedAssetRequestSchema = z.object({
  decision: studioReviewDecisionSchema,
  reviewScore: z.number().min(0).max(100).optional(),
  rejectionReasons: z.array(studioRejectReasonSchema).default([]),
  operatorNote: z.string().default(''),
})

export const createStudioContentDraftRequestSchema = z.object({
  generatedAssetId: z.string().min(1),
  captionOptions: z.array(z.string()).default([]),
  hashtags: z.array(z.string()).default([]),
  cta: z.string().default(''),
  publishNote: z.string().default(''),
  status: studioDraftStatusSchema.default('draft'),
})

export const createStudioPublishPackageRequestSchema = z.object({
  contentDraftId: z.string().min(1),
  finalCaption: z.string().optional(),
  checklist: z.array(z.string()).default([]),
})

export const createStudioPublishedPostRequestSchema = z.object({
  publishPackageId: z.string().min(1),
  platformPostUrl: z.string().url(),
  publishedAt: isoDateStringSchema.optional(),
  manualMetrics: studioManualMetricsSchema.default({
    impressions: 0,
    likes: 0,
    reposts: 0,
    replies: 0,
    bookmarks: 0,
    profileVisits: 0,
    linkClicks: 0,
  }),
  operatorMemo: z.string().default(''),
})

export const studioGenerationRunDetailSchema = z.object({
  run: studioGenerationRunSchema,
  assets: z.array(studioGeneratedAssetSchema),
})

export type StudioPlatform = z.infer<typeof studioPlatformSchema>
export type StudioTier = z.infer<typeof studioTierSchema>
export type StudioRejectReason = z.infer<typeof studioRejectReasonSchema>
export type StudioReviewDecision = z.infer<typeof reviewStudioGeneratedAssetRequestSchema>['decision']
export type StudioChannelAccount = z.infer<typeof studioChannelAccountSchema>
export type StudioChannelAccountState = z.infer<typeof studioChannelAccountStateSchema>
export type StudioCredentialSummary = z.infer<typeof studioCredentialSummarySchema>
export type StudioCharacterProfile = z.infer<typeof studioCharacterProfileSchema>
export type StudioPromptTemplate = z.infer<typeof studioPromptTemplateSchema>
export type StudioPromptSnapshot = z.infer<typeof studioPromptSnapshotSchema>
export type StudioParameterSnapshot = z.infer<typeof studioParameterSnapshotSchema>
export type StudioQualityCheck = z.infer<typeof studioQualityCheckSchema>
export type StudioGenerationRun = z.infer<typeof studioGenerationRunSchema>
export type StudioGeneratedAsset = z.infer<typeof studioGeneratedAssetSchema>
export type StudioContentDraft = z.infer<typeof studioContentDraftSchema>
export type StudioAssetRef = z.infer<typeof studioAssetRefSchema>
export type StudioPublishPackage = z.infer<typeof studioPublishPackageSchema>
export type StudioManualMetrics = z.infer<typeof studioManualMetricsSchema>
export type StudioPublishedPost = z.infer<typeof studioPublishedPostSchema>
export type StudioInsightsResponse = z.infer<typeof studioInsightsResponseSchema>
export type CreateStudioChannelAccountRequest = z.infer<typeof createStudioChannelAccountRequestSchema>
export type CreateStudioCharacterRequest = z.infer<typeof createStudioCharacterRequestSchema>
export type CreateStudioTemplateRequest = z.infer<typeof createStudioTemplateRequestSchema>
export type CreateStudioGenerationRunRequest = z.infer<typeof createStudioGenerationRunRequestSchema>
export type ReviewStudioGeneratedAssetRequest = z.infer<typeof reviewStudioGeneratedAssetRequestSchema>
export type CreateStudioContentDraftRequest = z.infer<typeof createStudioContentDraftRequestSchema>
export type CreateStudioPublishPackageRequest = z.infer<typeof createStudioPublishPackageRequestSchema>
export type CreateStudioPublishedPostRequest = z.infer<typeof createStudioPublishedPostRequestSchema>
export type StudioGenerationRunDetail = z.infer<typeof studioGenerationRunDetailSchema>
