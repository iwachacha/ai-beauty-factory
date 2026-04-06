'use client'

import { useEffect, useMemo, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import {
  reviewStudioGeneratedAssetRequestSchema,
  studioCharacterProfileSchema,
  studioGeneratedAssetSchema,
  studioGenerationRunSchema,
  studioPromptTemplateSchema,
} from '../../lib/studio-contracts'
import { studioFetch } from '../../lib/studio-api'
import {
  formatCompactDateTime,
  getReviewTone,
  statusChipStyle,
  studioReviewReasonOptions,
  studioReviewStatusLabels,
} from '../../lib/studio-ui'

const assetListSchema = z.array(studioGeneratedAssetSchema)
const runListSchema = z.array(studioGenerationRunSchema)
const characterListSchema = z.array(studioCharacterProfileSchema)
const templateListSchema = z.array(studioPromptTemplateSchema)

interface ReviewDraft {
  reviewScore: string
  rejectionReasons: z.infer<typeof reviewStudioGeneratedAssetRequestSchema>['rejectionReasons']
  operatorNote: string
}

export default function ReviewPage() {
  const { apiBase, session } = useFactory()
  const [assets, setAssets] = useState<z.infer<typeof assetListSchema>>([])
  const [runs, setRuns] = useState<z.infer<typeof runListSchema>>([])
  const [characters, setCharacters] = useState<z.infer<typeof characterListSchema>>([])
  const [templates, setTemplates] = useState<z.infer<typeof templateListSchema>>([])
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({})
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  const runById = useMemo(
    () => new Map(runs.map(run => [run.id, run])),
    [runs],
  )
  const characterById = useMemo(
    () => new Map(characters.map(character => [character.id, character])),
    [characters],
  )
  const templateById = useMemo(
    () => new Map(templates.map(template => [template.id, template])),
    [templates],
  )

  async function loadData() {
    if (!session) {
      return
    }

    setLoading(true)
    try {
      const [assetData, runData, characterData, templateData] = await Promise.all([
        studioFetch('/studio/v1/generated-assets', assetListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/generation-runs', runListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/characters', characterListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/templates', templateListSchema, {}, session.token, apiBase),
      ])
      setAssets(assetData)
      setRuns(runData)
      setCharacters(characterData)
      setTemplates(templateData)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load review queue')
    }
    finally {
      setLoading(false)
    }
  }

  function updateDraft(id: string, patch: Partial<ReviewDraft>) {
    setDrafts(current => ({
      ...current,
      [id]: {
        reviewScore: current[id]?.reviewScore || '',
        rejectionReasons: current[id]?.rejectionReasons || [],
        operatorNote: current[id]?.operatorNote || '',
        ...patch,
      },
    }))
  }

  async function submitReview(assetId: string, decision: 'approve' | 'reject' | 'needs_regenerate') {
    if (!session) {
      return
    }

    setSavingId(assetId)
    try {
      const draft = drafts[assetId] || {
        reviewScore: '',
        rejectionReasons: [],
        operatorNote: '',
      }

      const payload = reviewStudioGeneratedAssetRequestSchema.parse({
        decision,
        reviewScore: draft.reviewScore ? Number(draft.reviewScore) : undefined,
        rejectionReasons: decision === 'approve' ? [] : draft.rejectionReasons,
        operatorNote: draft.operatorNote,
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
      setSavingId('')
    }
  }

  useEffect(() => {
    void loadData()
  }, [session, apiBase])

  const orderedAssets = [...assets].sort((left, right) => {
    const priority = (status: typeof left.reviewStatus) => {
      if (status === 'pending_review') return 0
      if (status === 'needs_regenerate') return 1
      if (status === 'rejected') return 2
      return 3
    }
    return priority(left.reviewStatus) - priority(right.reviewStatus)
  })

  const pendingCount = assets.filter(asset => asset.reviewStatus === 'pending_review').length

  return (
    <FactoryShell
      title="Review"
      subtitle="Review generated assets quickly, keep rejection reasons structured, and push only approved content downstream."
    >
      <section style={cardStyle}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div style={softCardStyle}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Pending review</div>
            <strong style={{ fontSize: 28 }}>{pendingCount}</strong>
          </div>
          <div style={softCardStyle}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Approved</div>
            <strong style={{ fontSize: 28 }}>{assets.filter(asset => asset.reviewStatus === 'approved').length}</strong>
          </div>
          <div style={softCardStyle}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Rejected</div>
            <strong style={{ fontSize: 28 }}>{assets.filter(asset => asset.reviewStatus === 'rejected').length}</strong>
          </div>
          <div style={softCardStyle}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Needs regenerate</div>
            <strong style={{ fontSize: 28 }}>{assets.filter(asset => asset.reviewStatus === 'needs_regenerate').length}</strong>
          </div>
        </div>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="Loading review queue..." />
        : (
            <section style={{ display: 'grid', gap: 16 }}>
              {orderedAssets.map(asset => {
                const run = runById.get(asset.generationRunId)
                const character = run ? characterById.get(run.characterId) : null
                const template = run ? templateById.get(run.templateId) : null
                const draft = drafts[asset.id] || {
                  reviewScore: asset.reviewScore?.toString() || '',
                  rejectionReasons: asset.rejectionReasons,
                  operatorNote: asset.operatorNote,
                }

                return (
                  <article key={asset.id} style={cardStyle}>
                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(240px, 300px) minmax(0, 1fr)' }} className="review-grid">
                      <div style={{ display: 'grid', gap: 12 }}>
                        <img
                          src={asset.previewUrl}
                          alt={asset.assetId}
                          style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: 20, border: '1px solid var(--line)' }}
                        />
                        <div style={statusChipStyle(getReviewTone(asset.reviewStatus))}>
                          {studioReviewStatusLabels[asset.reviewStatus]}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <h3 style={{ margin: 0, fontFamily: 'var(--font-display), sans-serif' }}>{character?.displayName || 'Unknown character'}</h3>
                            <div style={{ color: 'var(--muted)', marginTop: 6 }}>
                              {template ? `${template.scene} · ${template.intent}` : 'Unknown template'}
                            </div>
                            <div style={{ color: 'var(--muted)', marginTop: 6 }}>
                              Asset {asset.assetId} · Generated {formatCompactDateTime(asset.createdAt)}
                            </div>
                          </div>
                          <div style={{ ...softCardStyle, minWidth: 180 }}>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Prompt context</div>
                            <div style={{ marginTop: 8 }}>{run?.targetTier || 'unknown tier'}</div>
                            <div style={{ color: 'var(--muted)', marginTop: 4 }}>{run?.workflowVersion || 'unknown workflow'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                          {asset.qualityChecks.map(check => (
                            <div key={check.code} style={softCardStyle}>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{check.label}</div>
                              <div style={{ marginTop: 8 }}>{check.status}</div>
                              {check.detail && <div style={{ marginTop: 4, color: 'var(--muted)' }}>{check.detail}</div>}
                            </div>
                          ))}
                        </div>

                        <label style={{ display: 'grid', gap: 8 }}>
                          <span>Review score</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={draft.reviewScore}
                            onChange={event => updateDraft(asset.id, { reviewScore: event.target.value })}
                            style={{ ...softCardStyle, border: '1px solid var(--line)', background: 'white' }}
                          />
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
                                      updateDraft(asset.id, {
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
                          <textarea
                            rows={4}
                            value={draft.operatorNote}
                            onChange={event => updateDraft(asset.id, { operatorNote: event.target.value })}
                            style={{ ...softCardStyle, border: '1px solid var(--line)', background: 'white' }}
                          />
                        </label>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <button onClick={() => void submitReview(asset.id, 'approve')} style={primaryButtonStyle} disabled={savingId === asset.id}>
                            {savingId === asset.id ? 'Saving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => void submitReview(asset.id, 'needs_regenerate')}
                            style={{ ...primaryButtonStyle, background: 'linear-gradient(135deg, #946b22, #c8922e)' }}
                            disabled={savingId === asset.id}
                          >
                            Needs regenerate
                          </button>
                          <button
                            onClick={() => void submitReview(asset.id, 'reject')}
                            style={{ ...primaryButtonStyle, background: 'linear-gradient(135deg, #8e3a34, #c4544c)' }}
                            disabled={savingId === asset.id}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
              {orderedAssets.length === 0 && (
                <section style={cardStyle}>
                  No generated assets yet. Create a generation run first and the review queue will appear here.
                </section>
              )}
            </section>
          )}

      <style jsx>{`
        @media (max-width: 900px) {
          .review-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </FactoryShell>
  )
}
