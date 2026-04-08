'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, fieldStyle, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import {
  createStudioContentDraftRequestSchema,
  createStudioGenerationRunRequestSchema,
  createStudioPaidOfferPackageRequestSchema,
  createStudioPublicPostPackageRequestSchema,
  reviewStudioGeneratedAssetRequestSchema,
  studioChannelAccountStateSchema,
  studioCharacterProfileSchema,
  studioContentDraftSchema,
  studioGeneratedAssetSchema,
  studioGenerationRunDetailSchema,
  studioGenerationRunSchema,
  studioOperatorConfigSchema,
  studioPaidOfferPackageSchema,
  studioPromptTemplateSchema,
  studioPublicPostPackageSchema,
} from '../../lib/studio-contracts'
import { studioFetch } from '../../lib/studio-api'
import {
  formatCompactDateTime,
  getReviewTone,
  splitCommaSeparated,
  splitLineSeparated,
  statusChipStyle,
  studioGenerationStatusLabels,
  studioReviewReasonOptions,
  studioReviewStatusLabels,
  studioSurfaceFitLabels,
  studioSurfaceFitOptions,
  studioTierOptions,
} from '../../lib/studio-ui'

const characterListSchema = z.array(studioCharacterProfileSchema)
const templateListSchema = z.array(studioPromptTemplateSchema)
const runListSchema = z.array(studioGenerationRunSchema)
const assetListSchema = z.array(studioGeneratedAssetSchema)
const draftListSchema = z.array(studioContentDraftSchema)
const publicPackageListSchema = z.array(studioPublicPostPackageSchema)
const paidPackageListSchema = z.array(studioPaidOfferPackageSchema)

interface ReviewDraft {
  reviewScore: string
  rejectionReasons: z.infer<typeof reviewStudioGeneratedAssetRequestSchema>['rejectionReasons']
  operatorNote: string
  surfaceFit: z.infer<typeof reviewStudioGeneratedAssetRequestSchema>['surfaceFit']
}

export default function OpsPage() {
  const { apiBase, session } = useFactory()
  const [operatorConfig, setOperatorConfig] = useState<z.infer<typeof studioOperatorConfigSchema> | null>(null)
  const [characters, setCharacters] = useState<z.infer<typeof characterListSchema>>([])
  const [templates, setTemplates] = useState<z.infer<typeof templateListSchema>>([])
  const [runs, setRuns] = useState<z.infer<typeof runListSchema>>([])
  const [assets, setAssets] = useState<z.infer<typeof assetListSchema>>([])
  const [drafts, setDrafts] = useState<z.infer<typeof draftListSchema>>([])
  const [publicPackages, setPublicPackages] = useState<z.infer<typeof publicPackageListSchema>>([])
  const [paidPackages, setPaidPackages] = useState<z.infer<typeof paidPackageListSchema>>([])
  const [channelState, setChannelState] = useState<z.infer<typeof studioChannelAccountStateSchema> | null>(null)
  const [draftMap, setDraftMap] = useState<Record<string, ReviewDraft>>({})
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [targetTier, setTargetTier] = useState<'free_sns' | 'subscriber' | 'premium'>('free_sns')
  const [draftForm, setDraftForm] = useState({
    generatedAssetId: '',
    publicCaptionOptions: '',
    publicHashtags: '',
    publicCtaLabel: '',
    publicCtaUrl: '',
    publicPostNote: '',
    paidTitle: '',
    paidHook: '',
    paidBody: '',
    paidOfferNote: '',
  })
  const [publicPackageForm, setPublicPackageForm] = useState({
    contentDraftId: '',
    finalCaption: '',
    ctaLabel: '',
    ctaUrl: '',
    checklist: '',
  })
  const [paidPackageForm, setPaidPackageForm] = useState({
    contentDraftId: '',
    title: '',
    teaserText: '',
    body: '',
    destinationUrl: '',
    checklist: '',
  })
  const [loading, setLoading] = useState(false)
  const [creatingRun, setCreatingRun] = useState(false)
  const [reviewingAssetId, setReviewingAssetId] = useState('')
  const [savingDraft, setSavingDraft] = useState(false)
  const [savingPublicPackage, setSavingPublicPackage] = useState(false)
  const [savingPaidPackage, setSavingPaidPackage] = useState(false)
  const [error, setError] = useState('')

  const runById = useMemo(() => new Map(runs.map(run => [run.id, run])), [runs])
  const characterById = useMemo(() => new Map(characters.map(character => [character.id, character])), [characters])

  async function loadData() {
    if (!session) {
      return
    }

    setLoading(true)
    try {
      const [
        nextOperatorConfig,
        characterData,
        templateData,
        runData,
        assetData,
        draftData,
        publicPackageData,
        paidPackageData,
        nextChannelState,
      ] = await Promise.all([
        studioFetch('/studio/v1/operator-config', studioOperatorConfigSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/characters', characterListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/templates', templateListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/generation-runs', runListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/generated-assets', assetListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/content-drafts', draftListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/public-post-packages', publicPackageListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/paid-offer-packages', paidPackageListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/channel-account', studioChannelAccountStateSchema, {}, session.token, apiBase),
      ])

      setOperatorConfig(nextOperatorConfig)
      setCharacters(characterData)
      setTemplates(templateData)
      setRuns(runData)
      setAssets(assetData)
      setDrafts(draftData)
      setPublicPackages(publicPackageData)
      setPaidPackages(paidPackageData)
      setChannelState(nextChannelState)
      setSelectedCharacterId(current => current || characterData[0]?.id || '')
      setSelectedTemplateId(current => current || templateData[0]?.id || '')
      setDraftForm(current => ({
        ...current,
        generatedAssetId: current.generatedAssetId || assetData.find(asset => asset.reviewStatus === 'approved')?.id || '',
        publicCtaLabel: current.publicCtaLabel || nextOperatorConfig.defaultCtaLabel,
        publicCtaUrl: current.publicCtaUrl || nextOperatorConfig.defaultCtaUrl,
      }))
      setPublicPackageForm(current => ({
        ...current,
        contentDraftId: current.contentDraftId || draftData[0]?.id || '',
      }))
      setPaidPackageForm(current => ({
        ...current,
        contentDraftId: current.contentDraftId || draftData[0]?.id || '',
        destinationUrl: current.destinationUrl || nextOperatorConfig.fanvueBaseUrl || '',
      }))
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load ops workspace')
    }
    finally {
      setLoading(false)
    }
  }

  function updateReviewDraft(id: string, patch: Partial<ReviewDraft>) {
    setDraftMap(current => ({
      ...current,
      [id]: {
        reviewScore: current[id]?.reviewScore || '',
        rejectionReasons: current[id]?.rejectionReasons || [],
        operatorNote: current[id]?.operatorNote || '',
        surfaceFit: current[id]?.surfaceFit || 'public_safe',
        ...patch,
      },
    }))
  }

  async function createRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setCreatingRun(true)
    try {
      const payload = createStudioGenerationRunRequestSchema.parse({
        characterId: selectedCharacterId,
        templateId: selectedTemplateId,
        targetPlatform: 'x',
        targetTier,
      })

      await studioFetch('/studio/v1/generation-runs', studioGenerationRunDetailSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setError('')
      await loadData()
    }
    catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create generation run')
    }
    finally {
      setCreatingRun(false)
    }
  }

  async function submitReview(assetId: string, decision: 'approve' | 'reject' | 'needs_regenerate') {
    if (!session) {
      return
    }

    setReviewingAssetId(assetId)
    try {
      const currentDraft = draftMap[assetId] || {
        reviewScore: '',
        rejectionReasons: [],
        operatorNote: '',
        surfaceFit: 'public_safe' as const,
      }

      const payload = reviewStudioGeneratedAssetRequestSchema.parse({
        decision,
        surfaceFit: decision === 'approve' ? currentDraft.surfaceFit : undefined,
        reviewScore: currentDraft.reviewScore ? Number(currentDraft.reviewScore) : undefined,
        rejectionReasons: decision === 'approve' ? [] : currentDraft.rejectionReasons,
        operatorNote: currentDraft.operatorNote,
      })

      const updatedAsset = await studioFetch(`/studio/v1/generated-assets/${assetId}/review`, studioGeneratedAssetSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setAssets(current => current.map(item => item.id === assetId ? updatedAsset : item))
      setError('')
    }
    catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to submit review')
    }
    finally {
      setReviewingAssetId('')
    }
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSavingDraft(true)
    try {
      const payload = createStudioContentDraftRequestSchema.parse({
        generatedAssetId: draftForm.generatedAssetId,
        publicCaptionOptions: splitLineSeparated(draftForm.publicCaptionOptions),
        publicHashtags: splitCommaSeparated(draftForm.publicHashtags),
        publicCtaLabel: draftForm.publicCtaLabel,
        publicCtaUrl: draftForm.publicCtaUrl || undefined,
        publicPostNote: draftForm.publicPostNote,
        paidTitle: draftForm.paidTitle,
        paidHook: draftForm.paidHook,
        paidBody: draftForm.paidBody,
        paidOfferNote: draftForm.paidOfferNote,
        status: 'draft',
      })

      await studioFetch('/studio/v1/content-drafts', studioContentDraftSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setDraftForm({
        generatedAssetId: '',
        publicCaptionOptions: '',
        publicHashtags: operatorConfig?.defaultPublicHashtags.join(', ') || '',
        publicCtaLabel: operatorConfig?.defaultCtaLabel || '',
        publicCtaUrl: operatorConfig?.defaultCtaUrl || '',
        publicPostNote: '',
        paidTitle: '',
        paidHook: '',
        paidBody: '',
        paidOfferNote: '',
      })
      setError('')
      await loadData()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create dual-surface draft')
    }
    finally {
      setSavingDraft(false)
    }
  }

  async function createPublicPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSavingPublicPackage(true)
    try {
      const payload = createStudioPublicPostPackageRequestSchema.parse({
        contentDraftId: publicPackageForm.contentDraftId,
        finalCaption: publicPackageForm.finalCaption || undefined,
        ctaLabel: publicPackageForm.ctaLabel || undefined,
        ctaUrl: publicPackageForm.ctaUrl || undefined,
        checklist: splitLineSeparated(publicPackageForm.checklist),
      })

      await studioFetch('/studio/v1/public-post-packages', studioPublicPostPackageSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setPublicPackageForm({
        contentDraftId: '',
        finalCaption: '',
        ctaLabel: '',
        ctaUrl: '',
        checklist: '',
      })
      setError('')
      await loadData()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create public package')
    }
    finally {
      setSavingPublicPackage(false)
    }
  }

  async function createPaidPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSavingPaidPackage(true)
    try {
      const payload = createStudioPaidOfferPackageRequestSchema.parse({
        contentDraftId: paidPackageForm.contentDraftId,
        title: paidPackageForm.title || undefined,
        teaserText: paidPackageForm.teaserText || undefined,
        body: paidPackageForm.body || undefined,
        destinationUrl: paidPackageForm.destinationUrl || undefined,
        checklist: splitLineSeparated(paidPackageForm.checklist),
      })

      await studioFetch('/studio/v1/paid-offer-packages', studioPaidOfferPackageSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setPaidPackageForm({
        contentDraftId: '',
        title: '',
        teaserText: '',
        body: '',
        destinationUrl: operatorConfig?.fanvueBaseUrl || '',
        checklist: '',
      })
      setError('')
      await loadData()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create paid package')
    }
    finally {
      setSavingPaidPackage(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [session, apiBase])

  const templateById = useMemo(() => new Map(templates.map(template => [template.id, template])), [templates])
  const approvedAssets = assets.filter(asset => asset.reviewStatus === 'approved')
  const pendingReviewAssets = [...assets].sort((left, right) => {
    const priority = (status: typeof left.reviewStatus) => {
      if (status === 'pending_review') return 0
      if (status === 'needs_regenerate') return 1
      if (status === 'rejected') return 2
      return 3
    }
    return priority(left.reviewStatus) - priority(right.reviewStatus)
  })
  const publicSafeDrafts = drafts.filter((draft) => {
    const asset = assets.find(item => item.id === draft.generatedAssetId)
    return asset?.surfaceFit === 'public_safe'
  })

  return (
    <FactoryShell
      title="Ops"
      subtitle="Run the core loop in one place: generate, review, route the asset, then export both the public teaser and the paid Fanvue package."
    >
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="Loading ops room..." />
        : (
            <>
              <section style={cardStyle}>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Pending review</div>
                    <strong style={{ fontSize: 28 }}>{assets.filter(asset => asset.reviewStatus === 'pending_review').length}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Approved assets</div>
                    <strong style={{ fontSize: 28 }}>{approvedAssets.length}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Prepared X packages</div>
                    <strong style={{ fontSize: 28 }}>{publicPackages.filter(item => item.status === 'prepared').length}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Prepared Fanvue packages</div>
                    <strong style={{ fontSize: 28 }}>{paidPackages.filter(item => item.status === 'prepared').length}</strong>
                  </div>
                </div>
              </section>

              <section style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Create generation run</h3>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
                      Start with a character and one template. Review decides whether the asset becomes a public teaser or a paid-only asset.
                    </p>
                  </div>
                  <div style={statusChipStyle(channelState?.activeAccountId ? 'success' : 'danger')}>
                    {channelState?.activeAccountId ? 'Active X account ready' : 'No active X account'}
                  </div>
                </div>

                <form onSubmit={createRun} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Generation character</span>
                      <select value={selectedCharacterId} onChange={event => setSelectedCharacterId(event.target.value)} style={fieldStyle} required>
                        <option value="">Select character</option>
                        {characters.map(character => (
                          <option key={character.id} value={character.id}>{character.displayName}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Generation template</span>
                      <select value={selectedTemplateId} onChange={event => setSelectedTemplateId(event.target.value)} style={fieldStyle} required>
                        <option value="">Select template</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>{template.scene} - {template.intent}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Target tier</span>
                      <select value={targetTier} onChange={event => setTargetTier(event.target.value as typeof targetTier)} style={fieldStyle}>
                        {studioTierOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button type="submit" style={primaryButtonStyle} disabled={creatingRun || !selectedCharacterId || !selectedTemplateId}>
                    {creatingRun ? 'Running generation...' : 'Create generation run'}
                  </button>
                </form>

                <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                  {runs.slice(0, 5).map(run => (
                    <article key={run.id} style={softCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <strong>{characterById.get(run.characterId)?.displayName || 'Unknown character'}</strong>
                          <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                            {templateById.get(run.templateId)?.scene || 'Unknown template'} - {studioGenerationStatusLabels[run.status]}
                          </div>
                        </div>
                        <div style={{ color: 'var(--muted)' }}>{formatCompactDateTime(run.createdAt)}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Review and route assets</h3>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
                      Approval is not enough anymore. Every approved asset must be routed to either the public X surface or paid-only Fanvue export.
                    </p>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Current public rules</div>
                    <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                      {(operatorConfig?.publicGuidelines.length || 0) > 0 ? operatorConfig?.publicGuidelines.join('\n') : 'No public-safe rules saved yet.'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
                  {pendingReviewAssets.map(asset => {
                    const run = runById.get(asset.generationRunId)
                    const character = run ? characterById.get(run.characterId) : null
                    const template = run ? templateById.get(run.templateId) : null
                    const draft = draftMap[asset.id] || {
                      reviewScore: asset.reviewScore?.toString() || '',
                      rejectionReasons: asset.rejectionReasons,
                      operatorNote: asset.operatorNote,
                      surfaceFit: asset.surfaceFit || 'public_safe',
                    }

                    return (
                      <article key={asset.id} style={softCardStyle}>
                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)' }} className="ops-review-grid">
                          <div style={{ display: 'grid', gap: 12 }}>
                            <img src={asset.previewUrl} alt={`Generated asset ${asset.assetId}`} style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: 20, border: '1px solid var(--line)' }} />
                            <div style={statusChipStyle(getReviewTone(asset.reviewStatus))}>{studioReviewStatusLabels[asset.reviewStatus]}</div>
                            {asset.surfaceFit && <div style={statusChipStyle(asset.surfaceFit === 'public_safe' ? 'success' : 'default')}>{studioSurfaceFitLabels[asset.surfaceFit]}</div>}
                          </div>

                          <div style={{ display: 'grid', gap: 14 }}>
                            <div>
                              <strong>{character?.displayName || 'Unknown character'}</strong>
                              <div style={{ color: 'var(--muted)', marginTop: 4 }}>{template ? `${template.scene} - ${template.intent}` : 'Unknown template'}</div>
                              <div style={{ color: 'var(--muted)', marginTop: 4 }}>Asset {asset.assetId} - Generated {formatCompactDateTime(asset.createdAt)}</div>
                            </div>

                            <div style={{ display: 'grid', gap: 8 }}>
                              <span>Surface fit</span>
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {studioSurfaceFitOptions.map(option => (
                                  <label key={option.value} style={{ ...softCardStyle, display: 'grid', gap: 4, minWidth: 180 }}>
                                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                      <input
                                        type="radio"
                                        name={`surface-fit-${asset.id}`}
                                        checked={draft.surfaceFit === option.value}
                                        onChange={() => updateReviewDraft(asset.id, { surfaceFit: option.value })}
                                      />
                                      <strong>{option.label}</strong>
                                    </span>
                                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{option.description}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <label style={{ display: 'grid', gap: 8 }}>
                              <span>Review score</span>
                              <input type="number" min={0} max={100} value={draft.reviewScore} onChange={event => updateReviewDraft(asset.id, { reviewScore: event.target.value })} style={fieldStyle} />
                            </label>

                            <div style={{ display: 'grid', gap: 8 }}>
                              <span>Reject taxonomy</span>
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {studioReviewReasonOptions.map(reason => {
                                  const checked = draft.rejectionReasons.includes(reason.value)
                                  return (
                                    <label key={reason.value} style={{ ...softCardStyle, display: 'flex', gap: 8, alignItems: 'center' }}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) => {
                                          updateReviewDraft(asset.id, {
                                            rejectionReasons: event.target.checked
                                              ? [...draft.rejectionReasons, reason.value]
                                              : draft.rejectionReasons.filter(item => item !== reason.value),
                                          })
                                        }}
                                      />
                                      <span>{reason.label}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>

                            <label style={{ display: 'grid', gap: 8 }}>
                              <span>Operator note</span>
                              <textarea rows={3} value={draft.operatorNote} onChange={event => updateReviewDraft(asset.id, { operatorNote: event.target.value })} style={fieldStyle} />
                            </label>

                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              <button onClick={() => void submitReview(asset.id, 'approve')} style={primaryButtonStyle} disabled={reviewingAssetId === asset.id}>
                                {reviewingAssetId === asset.id ? 'Saving...' : 'Approve'}
                              </button>
                              <button onClick={() => void submitReview(asset.id, 'needs_regenerate')} style={{ ...primaryButtonStyle, background: 'linear-gradient(135deg, #946b22, #c8922e)' }} disabled={reviewingAssetId === asset.id}>
                                Needs regenerate
                              </button>
                              <button onClick={() => void submitReview(asset.id, 'reject')} style={{ ...primaryButtonStyle, background: 'linear-gradient(135deg, #8e3a34, #c4544c)' }} disabled={reviewingAssetId === asset.id}>
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}

                  {pendingReviewAssets.length === 0 && (
                    <div style={softCardStyle}>No generated assets are waiting in the review queue.</div>
                  )}
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Build a dual-surface draft</h3>
                <form onSubmit={createDraft} style={{ display: 'grid', gap: 14 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Approved asset</span>
                    <select value={draftForm.generatedAssetId} onChange={event => setDraftForm(current => ({ ...current, generatedAssetId: event.target.value }))} style={fieldStyle} required>
                      <option value="">Select approved asset</option>
                      {approvedAssets.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.assetId} {asset.surfaceFit ? `- ${studioSurfaceFitLabels[asset.surfaceFit]}` : ''}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Public caption options</span>
                    <textarea value={draftForm.publicCaptionOptions} onChange={event => setDraftForm(current => ({ ...current, publicCaptionOptions: event.target.value }))} rows={5} style={fieldStyle} />
                  </label>

                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Public hashtags</span>
                      <input value={draftForm.publicHashtags} onChange={event => setDraftForm(current => ({ ...current, publicHashtags: event.target.value }))} style={fieldStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Public CTA label</span>
                      <input value={draftForm.publicCtaLabel} onChange={event => setDraftForm(current => ({ ...current, publicCtaLabel: event.target.value }))} style={fieldStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Public CTA URL</span>
                      <input value={draftForm.publicCtaUrl} onChange={event => setDraftForm(current => ({ ...current, publicCtaUrl: event.target.value }))} style={fieldStyle} />
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Public post note</span>
                    <textarea value={draftForm.publicPostNote} onChange={event => setDraftForm(current => ({ ...current, publicPostNote: event.target.value }))} rows={3} style={fieldStyle} />
                  </label>

                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Paid title</span>
                      <input value={draftForm.paidTitle} onChange={event => setDraftForm(current => ({ ...current, paidTitle: event.target.value }))} style={fieldStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Paid teaser</span>
                      <input value={draftForm.paidHook} onChange={event => setDraftForm(current => ({ ...current, paidHook: event.target.value }))} style={fieldStyle} />
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Paid body</span>
                    <textarea value={draftForm.paidBody} onChange={event => setDraftForm(current => ({ ...current, paidBody: event.target.value }))} rows={5} style={fieldStyle} />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Paid offer note</span>
                    <textarea value={draftForm.paidOfferNote} onChange={event => setDraftForm(current => ({ ...current, paidOfferNote: event.target.value }))} rows={3} style={fieldStyle} />
                  </label>

                  <button type="submit" style={primaryButtonStyle} disabled={savingDraft || !draftForm.generatedAssetId}>
                    {savingDraft ? 'Saving draft...' : 'Create dual-surface draft'}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Export X public package</h3>
                <form onSubmit={createPublicPackage} style={{ display: 'grid', gap: 14 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Public package draft</span>
                    <select value={publicPackageForm.contentDraftId} onChange={event => setPublicPackageForm(current => ({ ...current, contentDraftId: event.target.value }))} style={fieldStyle} required>
                      <option value="">Select draft</option>
                      {publicSafeDrafts.map(draft => (
                        <option key={draft.id} value={draft.id}>{draft.generatedAssetId.slice(-8)} - {draft.status}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Final public caption</span>
                    <textarea value={publicPackageForm.finalCaption} onChange={event => setPublicPackageForm(current => ({ ...current, finalCaption: event.target.value }))} rows={4} style={fieldStyle} />
                  </label>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Final CTA label</span>
                      <input value={publicPackageForm.ctaLabel} onChange={event => setPublicPackageForm(current => ({ ...current, ctaLabel: event.target.value }))} style={fieldStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Final CTA URL</span>
                      <input value={publicPackageForm.ctaUrl} onChange={event => setPublicPackageForm(current => ({ ...current, ctaUrl: event.target.value }))} style={fieldStyle} />
                    </label>
                  </div>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Public checklist</span>
                    <textarea value={publicPackageForm.checklist} onChange={event => setPublicPackageForm(current => ({ ...current, checklist: event.target.value }))} rows={4} style={fieldStyle} />
                  </label>
                  <button type="submit" style={primaryButtonStyle} disabled={savingPublicPackage || !publicPackageForm.contentDraftId}>
                    {savingPublicPackage ? 'Saving public package...' : 'Create X public package'}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Export Fanvue paid package</h3>
                <form onSubmit={createPaidPackage} style={{ display: 'grid', gap: 14 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Paid package draft</span>
                    <select value={paidPackageForm.contentDraftId} onChange={event => setPaidPackageForm(current => ({ ...current, contentDraftId: event.target.value }))} style={fieldStyle} required>
                      <option value="">Select draft</option>
                      {drafts.map(draft => (
                        <option key={draft.id} value={draft.id}>{draft.generatedAssetId.slice(-8)} - {draft.status}</option>
                      ))}
                    </select>
                  </label>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Paid title</span>
                      <input value={paidPackageForm.title} onChange={event => setPaidPackageForm(current => ({ ...current, title: event.target.value }))} style={fieldStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Paid teaser</span>
                      <input value={paidPackageForm.teaserText} onChange={event => setPaidPackageForm(current => ({ ...current, teaserText: event.target.value }))} style={fieldStyle} />
                    </label>
                  </div>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Paid body</span>
                    <textarea value={paidPackageForm.body} onChange={event => setPaidPackageForm(current => ({ ...current, body: event.target.value }))} rows={5} style={fieldStyle} />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Fanvue destination URL</span>
                    <input value={paidPackageForm.destinationUrl} onChange={event => setPaidPackageForm(current => ({ ...current, destinationUrl: event.target.value }))} style={fieldStyle} />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Paid checklist</span>
                    <textarea value={paidPackageForm.checklist} onChange={event => setPaidPackageForm(current => ({ ...current, checklist: event.target.value }))} rows={4} style={fieldStyle} />
                  </label>
                  <button type="submit" style={primaryButtonStyle} disabled={savingPaidPackage || !paidPackageForm.contentDraftId}>
                    {savingPaidPackage ? 'Saving paid package...' : 'Create Fanvue paid package'}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Prepared exports</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {publicPackages.map(item => (
                    <article key={item.id} style={softCardStyle}>
                      <strong>X public - {item.status}</strong>
                      <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.finalCaption}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 8 }}>{item.hashtags.join(' ')}</div>
                    </article>
                  ))}
                  {paidPackages.map(item => (
                    <article key={item.id} style={softCardStyle}>
                      <strong>Fanvue paid - {item.status}</strong>
                      <div style={{ marginTop: 8 }}>{item.title}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.body}</div>
                    </article>
                  ))}
                  {publicPackages.length === 0 && paidPackages.length === 0 && (
                    <div style={softCardStyle}>No export packages have been prepared yet.</div>
                  )}
                </div>
              </section>

              <style jsx>{`
                @media (max-width: 900px) {
                  .ops-review-grid {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>
            </>
          )}
    </FactoryShell>
  )
}
