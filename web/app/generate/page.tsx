'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, fieldStyle, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import {
  createStudioGenerationRunRequestSchema,
  studioChannelAccountStateSchema,
  studioCharacterProfileSchema,
  studioGenerationRunDetailSchema,
  studioGenerationRunSchema,
  studioPromptTemplateSchema,
} from '../../lib/studio-contracts'
import { studioFetch } from '../../lib/studio-api'
import {
  formatCompactDateTime,
  formatDateTime,
  statusChipStyle,
  studioGenerationStatusLabels,
  studioTierOptions,
} from '../../lib/studio-ui'

const characterListSchema = z.array(studioCharacterProfileSchema)
const templateListSchema = z.array(studioPromptTemplateSchema)
const runListSchema = z.array(studioGenerationRunSchema)

export default function GeneratePage() {
  const { apiBase, session } = useFactory()
  const [characters, setCharacters] = useState<z.infer<typeof characterListSchema>>([])
  const [templates, setTemplates] = useState<z.infer<typeof templateListSchema>>([])
  const [runs, setRuns] = useState<z.infer<typeof runListSchema>>([])
  const [channelState, setChannelState] = useState<z.infer<typeof studioChannelAccountStateSchema> | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [targetTier, setTargetTier] = useState<'free_sns' | 'subscriber' | 'premium'>('free_sns')
  const [selectedRunId, setSelectedRunId] = useState('')
  const [runDetail, setRunDetail] = useState<z.infer<typeof studioGenerationRunDetailSchema> | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadRunDetail(runId: string) {
    if (!session || !runId) {
      return
    }

    setDetailLoading(true)
    try {
      const detail = await studioFetch(`/studio/v1/generation-runs/${runId}`, studioGenerationRunDetailSchema, {}, session.token, apiBase)
      setRunDetail(detail)
      setSelectedRunId(runId)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load generation run detail')
    }
    finally {
      setDetailLoading(false)
    }
  }

  async function loadPageData() {
    if (!session) {
      return
    }

    setLoading(true)
    try {
      const [characterData, templateData, runData, nextChannelState] = await Promise.all([
        studioFetch('/studio/v1/characters', characterListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/templates', templateListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/generation-runs', runListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/channel-account', studioChannelAccountStateSchema, {}, session.token, apiBase),
      ])

      setCharacters(characterData)
      setTemplates(templateData)
      setRuns(runData)
      setChannelState(nextChannelState)
      setSelectedCharacterId(current => current || characterData[0]?.id || '')
      setSelectedTemplateId(current => current || templateData[0]?.id || '')
      setError('')

      const nextRunId = selectedRunId || runData[0]?.id || ''
      if (nextRunId) {
        await loadRunDetail(nextRunId)
      }
      else {
        setRunDetail(null)
      }
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load generation data')
    }
    finally {
      setLoading(false)
    }
  }

  async function createRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSubmitting(true)
    try {
      const payload = createStudioGenerationRunRequestSchema.parse({
        characterId: selectedCharacterId,
        templateId: selectedTemplateId,
        targetPlatform: 'x',
        targetTier,
      })

      const detail = await studioFetch('/studio/v1/generation-runs', studioGenerationRunDetailSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setRunDetail(detail)
      setSelectedRunId(detail.run.id)
      setError('')

      const nextRuns = await studioFetch('/studio/v1/generation-runs', runListSchema, {}, session.token, apiBase)
      setRuns(nextRuns)
    }
    catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create generation run')
    }
    finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [session, apiBase])

  return (
    <FactoryShell
      title="Generate"
      subtitle="Create reproducible ComfyUI runs with prompt snapshots, model settings, and review-ready assets."
    >
      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Create generation run</h3>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
              Pick one character, one template, and one target tier. Every run stores the exact prompt and workflow snapshot.
            </p>
          </div>
          <div style={statusChipStyle(channelState?.activeAccountId ? 'success' : 'danger')}>
            {channelState?.activeAccountId ? 'Active X account ready' : 'No active X account'}
          </div>
        </div>

        <form onSubmit={createRun} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Character</span>
              <select value={selectedCharacterId} onChange={event => setSelectedCharacterId(event.target.value)} style={fieldStyle} required>
                <option value="">Select character</option>
                {characters.map(character => (
                  <option key={character.id} value={character.id}>{character.displayName}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Template</span>
              <select value={selectedTemplateId} onChange={event => setSelectedTemplateId(event.target.value)} style={fieldStyle} required>
                <option value="">Select template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.scene} · {template.intent}</option>
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
          <button type="submit" style={primaryButtonStyle} disabled={submitting || !selectedCharacterId || !selectedTemplateId}>
            {submitting ? 'Running generation...' : 'Create generation run'}
          </button>
        </form>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="Loading generation workspace..." />
        : (
            <>
              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Recent runs</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {runs.map(run => (
                    <article key={run.id} style={softCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                          <strong>{run.targetPlatform.toUpperCase()} · {run.targetTier}</strong>
                          <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                            {studioGenerationStatusLabels[run.status]} · {formatCompactDateTime(run.createdAt)}
                          </div>
                        </div>
                        <button onClick={() => void loadRunDetail(run.id)} style={primaryButtonStyle}>
                          Inspect run
                        </button>
                      </div>
                    </article>
                  ))}
                  {runs.length === 0 && (
                    <div style={softCardStyle}>No generation runs yet.</div>
                  )}
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Run detail</h3>
                {detailLoading
                  ? <LoadingSpinner label="Loading run detail..." />
                  : runDetail
                    ? (
                        <div style={{ display: 'grid', gap: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                              <strong>Run {runDetail.run.id.slice(-8)}</strong>
                              <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                                {studioGenerationStatusLabels[runDetail.run.status]} · Started {formatDateTime(runDetail.run.startedAt)}
                              </div>
                            </div>
                            <div style={statusChipStyle(runDetail.run.status === 'completed' ? 'success' : runDetail.run.status === 'failed' ? 'danger' : 'default')}>
                              {studioGenerationStatusLabels[runDetail.run.status]}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                            <div style={softCardStyle}>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Workflow version</div>
                              <div style={{ marginTop: 8 }}>{runDetail.run.workflowVersion}</div>
                            </div>
                            <div style={softCardStyle}>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Model and seed</div>
                              <div style={{ marginTop: 8 }}>{runDetail.run.parameterSnapshot.model}</div>
                              <div style={{ color: 'var(--muted)', marginTop: 4 }}>Seed {runDetail.run.parameterSnapshot.seed}</div>
                            </div>
                            <div style={softCardStyle}>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Canvas</div>
                              <div style={{ marginTop: 8 }}>
                                {runDetail.run.parameterSnapshot.width} × {runDetail.run.parameterSnapshot.height}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                            <div style={softCardStyle}>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Positive prompt</div>
                              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{runDetail.run.promptSnapshot.positivePrompt}</div>
                            </div>
                            <div style={softCardStyle}>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Negative prompt</div>
                              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{runDetail.run.promptSnapshot.negativePrompt}</div>
                            </div>
                          </div>

                          {runDetail.run.error && (
                            <div style={{ ...softCardStyle, color: 'var(--danger)' }}>
                              {runDetail.run.error}
                            </div>
                          )}

                          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                            {runDetail.assets.map(asset => (
                              <article key={asset.id} style={softCardStyle}>
                                <img
                                  src={asset.previewUrl}
                                  alt={`Generated asset ${asset.assetId}`}
                                  style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: 16, border: '1px solid var(--line)' }}
                                />
                                <div style={{ marginTop: 12, fontWeight: 600 }}>{asset.assetId}</div>
                                <div style={{ color: 'var(--muted)', marginTop: 4 }}>{asset.reviewStatus}</div>
                              </article>
                            ))}
                            {runDetail.assets.length === 0 && (
                              <div style={softCardStyle}>No generated assets were returned for this run.</div>
                            )}
                          </div>
                        </div>
                      )
                    : (
                        <div style={softCardStyle}>Select a run to inspect prompt snapshots and generated assets.</div>
                      )}
              </section>
            </>
          )}
    </FactoryShell>
  )
}
