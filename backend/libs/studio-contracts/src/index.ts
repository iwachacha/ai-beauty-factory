import z from 'zod'

export const studioPlatformSchema = z.enum(['x', 'fanvue'])
export const studioPublicChannelSchema = z.literal('x')
export const studioPaidChannelSchema = z.literal('fanvue')
export const studioTierSchema = z.enum(['free_sns', 'subscriber', 'premium'])
export const studioEntityStatusSchema = z.enum(['draft', 'active', 'archived'])
export const studioGenerationStatusSchema = z.enum(['queued', 'running', 'completed', 'failed'])
export const studioReviewStatusSchema = z.enum(['pending_review', 'approved', 'rejected', 'needs_regenerate'])
export const studioAssetSurfaceFitSchema = z.enum(['public_safe', 'paid_only'])
export const studioDraftStatusSchema = z.enum(['draft', 'ready'])
export const studioPublicPostPackageStatusSchema = z.enum(['prepared', 'posted'])
export const studioPaidOfferPackageStatusSchema = z.enum(['prepared', 'delivered'])
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
  platform: studioPublicChannelSchema,
  status: studioChannelAccountStatusSchema,
  isActive: z.boolean(),
  credentialSummary: studioCredentialSummarySchema,
})

export const studioAvailableAccountSchema = z.object({
  accountId: z.string(),
  platform: studioPublicChannelSchema,
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

export const studioOperatorConfigSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  publicChannel: studioPublicChannelSchema,
  paidChannel: studioPaidChannelSchema,
  defaultCtaLabel: z.string(),
  defaultCtaUrl: z.string().url(),
  defaultPublicHashtags: z.array(z.string()),
  defaultPublicChecklist: z.array(z.string()),
  defaultPaidChecklist: z.array(z.string()),
  publicGuidelines: z.array(z.string()),
  paidGuidelines: z.array(z.string()),
  fanvueCreatorName: z.string(),
  fanvueBaseUrl: z.string().url().nullable(),
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
  targetPlatform: studioPublicChannelSchema,
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
  surfaceFit: studioAssetSurfaceFitSchema.nullable(),
  reviewScore: z.number().min(0).max(100).nullable(),
  rejectionReasons: z.array(studioRejectReasonSchema),
  operatorNote: z.string(),
  qualityChecks: z.array(studioQualityCheckSchema),
})

export const studioContentDraftSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  generatedAssetId: z.string(),
  publicCaptionOptions: z.array(z.string()),
  publicHashtags: z.array(z.string()),
  publicCtaLabel: z.string(),
  publicCtaUrl: z.string().url(),
  publicPostNote: z.string(),
  paidTitle: z.string(),
  paidHook: z.string(),
  paidBody: z.string(),
  paidOfferNote: z.string(),
  status: studioDraftStatusSchema,
})

export const studioAssetRefSchema = z.object({
  assetId: z.string(),
  previewUrl: z.string().url(),
})

export const studioPublicPostPackageSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  contentDraftId: z.string(),
  channelAccountId: z.string(),
  publicChannel: studioPublicChannelSchema,
  finalCaption: z.string(),
  hashtags: z.array(z.string()),
  ctaLabel: z.string(),
  ctaUrl: z.string().url(),
  assetRefs: z.array(studioAssetRefSchema),
  checklist: z.array(z.string()),
  status: studioPublicPostPackageStatusSchema,
  exportedAt: isoDateStringSchema,
})

export const studioPaidOfferPackageSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  contentDraftId: z.string(),
  paidChannel: studioPaidChannelSchema,
  title: z.string(),
  teaserText: z.string(),
  body: z.string(),
  destinationUrl: z.string().url().nullable(),
  assetRefs: z.array(studioAssetRefSchema),
  checklist: z.array(z.string()),
  status: studioPaidOfferPackageStatusSchema,
  exportedAt: isoDateStringSchema,
})

export const studioPublicMetricsSchema = z.object({
  impressions: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  reposts: z.number().int().nonnegative(),
  replies: z.number().int().nonnegative(),
  bookmarks: z.number().int().nonnegative(),
  profileVisits: z.number().int().nonnegative(),
  linkClicks: z.number().int().nonnegative(),
})

export const studioPaidMetricsSchema = z.object({
  landingVisits: z.number().int().nonnegative(),
  subscriberConversions: z.number().int().nonnegative(),
  renewals: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
})

export const studioFunnelMetricsSchema = studioTimestampSchema.extend({
  id: z.string(),
  userId: z.string(),
  publicPostPackageId: z.string(),
  paidOfferPackageId: z.string(),
  publicPostUrl: z.string().url().nullable(),
  recordedAt: isoDateStringSchema,
  publicMetrics: studioPublicMetricsSchema,
  paidMetrics: studioPaidMetricsSchema,
  operatorMemo: z.string(),
})

export const studioInsightsResponseSchema = z.object({
  summary: z.object({
    totalPublicPosts: z.number().int().nonnegative(),
    totalImpressions: z.number().int().nonnegative(),
    totalLikes: z.number().int().nonnegative(),
    totalReposts: z.number().int().nonnegative(),
    totalReplies: z.number().int().nonnegative(),
    totalBookmarks: z.number().int().nonnegative(),
    totalProfileVisits: z.number().int().nonnegative(),
    totalLinkClicks: z.number().int().nonnegative(),
    totalLandingVisits: z.number().int().nonnegative(),
    totalSubscriberConversions: z.number().int().nonnegative(),
    totalRenewals: z.number().int().nonnegative(),
    totalRevenue: z.number().nonnegative(),
  }),
  items: z.array(studioFunnelMetricsSchema),
  pendingPublicPostPackages: z.array(studioPublicPostPackageSchema),
  pendingPaidOfferPackages: z.array(studioPaidOfferPackageSchema),
})

export const createStudioOperatorConfigRequestSchema = z.object({
  defaultCtaLabel: z.string().min(1).default('See the full set'),
  defaultCtaUrl: z.string().url().default('https://fanvue.com'),
  defaultPublicHashtags: z.array(z.string()).default(['#AIBeauty']),
  defaultPublicChecklist: z.array(z.string()).default([]),
  defaultPaidChecklist: z.array(z.string()).default([]),
  publicGuidelines: z.array(z.string()).default([]),
  paidGuidelines: z.array(z.string()).default([]),
  fanvueCreatorName: z.string().default(''),
  fanvueBaseUrl: z.string().url().nullable().default(null),
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
  targetPlatform: studioPublicChannelSchema.default('x'),
  targetTier: studioTierSchema.default('free_sns'),
})

export const reviewStudioGeneratedAssetRequestSchema = z.object({
  decision: studioReviewDecisionSchema,
  surfaceFit: studioAssetSurfaceFitSchema.optional(),
  reviewScore: z.number().min(0).max(100).optional(),
  rejectionReasons: z.array(studioRejectReasonSchema).default([]),
  operatorNote: z.string().default(''),
}).superRefine((value, ctx) => {
  if (value.decision === 'approve' && !value.surfaceFit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['surfaceFit'],
      message: 'Approved assets must be marked public_safe or paid_only.',
    })
  }
})

export const createStudioContentDraftRequestSchema = z.object({
  generatedAssetId: z.string().min(1),
  publicCaptionOptions: z.array(z.string()).default([]),
  publicHashtags: z.array(z.string()).default([]),
  publicCtaLabel: z.string().default(''),
  publicCtaUrl: z.string().url().optional(),
  publicPostNote: z.string().default(''),
  paidTitle: z.string().default(''),
  paidHook: z.string().default(''),
  paidBody: z.string().default(''),
  paidOfferNote: z.string().default(''),
  status: studioDraftStatusSchema.default('draft'),
})

export const createStudioPublicPostPackageRequestSchema = z.object({
  contentDraftId: z.string().min(1),
  finalCaption: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().url().optional(),
  checklist: z.array(z.string()).default([]),
})

export const createStudioPaidOfferPackageRequestSchema = z.object({
  contentDraftId: z.string().min(1),
  title: z.string().optional(),
  teaserText: z.string().optional(),
  body: z.string().optional(),
  destinationUrl: z.string().url().optional(),
  checklist: z.array(z.string()).default([]),
})

export const createStudioFunnelMetricsRequestSchema = z.object({
  publicPostPackageId: z.string().min(1),
  paidOfferPackageId: z.string().min(1),
  publicPostUrl: z.string().url().optional(),
  recordedAt: isoDateStringSchema.optional(),
  publicMetrics: studioPublicMetricsSchema.default({
    impressions: 0,
    likes: 0,
    reposts: 0,
    replies: 0,
    bookmarks: 0,
    profileVisits: 0,
    linkClicks: 0,
  }),
  paidMetrics: studioPaidMetricsSchema.default({
    landingVisits: 0,
    subscriberConversions: 0,
    renewals: 0,
    revenue: 0,
  }),
  operatorMemo: z.string().default(''),
})

export const studioGenerationRunDetailSchema = z.object({
  run: studioGenerationRunSchema,
  assets: z.array(studioGeneratedAssetSchema),
})

export type StudioPlatform = z.infer<typeof studioPlatformSchema>
export type StudioPublicChannel = z.infer<typeof studioPublicChannelSchema>
export type StudioPaidChannel = z.infer<typeof studioPaidChannelSchema>
export type StudioTier = z.infer<typeof studioTierSchema>
export type StudioRejectReason = z.infer<typeof studioRejectReasonSchema>
export type StudioAssetSurfaceFit = z.infer<typeof studioAssetSurfaceFitSchema>
export type StudioReviewDecision = z.infer<typeof reviewStudioGeneratedAssetRequestSchema>['decision']
export type StudioChannelAccount = z.infer<typeof studioChannelAccountSchema>
export type StudioChannelAccountState = z.infer<typeof studioChannelAccountStateSchema>
export type StudioCredentialSummary = z.infer<typeof studioCredentialSummarySchema>
export type StudioCharacterProfile = z.infer<typeof studioCharacterProfileSchema>
export type StudioPromptTemplate = z.infer<typeof studioPromptTemplateSchema>
export type StudioOperatorConfig = z.infer<typeof studioOperatorConfigSchema>
export type StudioPromptSnapshot = z.infer<typeof studioPromptSnapshotSchema>
export type StudioParameterSnapshot = z.infer<typeof studioParameterSnapshotSchema>
export type StudioQualityCheck = z.infer<typeof studioQualityCheckSchema>
export type StudioGenerationRun = z.infer<typeof studioGenerationRunSchema>
export type StudioGeneratedAsset = z.infer<typeof studioGeneratedAssetSchema>
export type StudioContentDraft = z.infer<typeof studioContentDraftSchema>
export type StudioAssetRef = z.infer<typeof studioAssetRefSchema>
export type StudioPublicPostPackage = z.infer<typeof studioPublicPostPackageSchema>
export type StudioPaidOfferPackage = z.infer<typeof studioPaidOfferPackageSchema>
export type StudioPublicMetrics = z.infer<typeof studioPublicMetricsSchema>
export type StudioPaidMetrics = z.infer<typeof studioPaidMetricsSchema>
export type StudioFunnelMetrics = z.infer<typeof studioFunnelMetricsSchema>
export type StudioInsightsResponse = z.infer<typeof studioInsightsResponseSchema>
export type CreateStudioOperatorConfigRequest = z.infer<typeof createStudioOperatorConfigRequestSchema>
export type CreateStudioChannelAccountRequest = z.infer<typeof createStudioChannelAccountRequestSchema>
export type CreateStudioCharacterRequest = z.infer<typeof createStudioCharacterRequestSchema>
export type CreateStudioTemplateRequest = z.infer<typeof createStudioTemplateRequestSchema>
export type CreateStudioGenerationRunRequest = z.infer<typeof createStudioGenerationRunRequestSchema>
export type ReviewStudioGeneratedAssetRequest = z.infer<typeof reviewStudioGeneratedAssetRequestSchema>
export type CreateStudioContentDraftRequest = z.infer<typeof createStudioContentDraftRequestSchema>
export type CreateStudioPublicPostPackageRequest = z.infer<typeof createStudioPublicPostPackageRequestSchema>
export type CreateStudioPaidOfferPackageRequest = z.infer<typeof createStudioPaidOfferPackageRequestSchema>
export type CreateStudioFunnelMetricsRequest = z.infer<typeof createStudioFunnelMetricsRequestSchema>
export type StudioGenerationRunDetail = z.infer<typeof studioGenerationRunDetailSchema>
