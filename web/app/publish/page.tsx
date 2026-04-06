'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, fieldStyle, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import {
  createStudioContentDraftRequestSchema,
  createStudioPublishPackageRequestSchema,
  studioChannelAccountStateSchema,
  studioContentDraftSchema,
  studioGeneratedAssetSchema,
  studioPublishPackageSchema,
} from '../../lib/studio-contracts'
import { studioFetch } from '../../lib/studio-api'
import {
  formatDateTime,
  splitCommaSeparated,
  splitLineSeparated,
  statusChipStyle,
} from '../../lib/studio-ui'

const assetListSchema = z.array(studioGeneratedAssetSchema)
const draftListSchema = z.array(studioContentDraftSchema)
const publishPackageListSchema = z.array(studioPublishPackageSchema)

export default function PublishPage() {
  const { apiBase, session } = useFactory()
  const [assets, setAssets] = useState<z.infer<typeof assetListSchema>>([])
  const [drafts, setDrafts] = useState<z.infer<typeof draftListSchema>>([])
  const [packages, setPackages] = useState<z.infer<typeof publishPackageListSchema>>([])
  const [channelState, setChannelState] = useState<z.infer<typeof studioChannelAccountStateSchema> | null>(null)
  const [draftForm, setDraftForm] = useState({
    generatedAssetId: '',
    captionOptions: '',
    hashtags: '',
    cta: '',
    publishNote: '',
  })
  const [packageForm, setPackageForm] = useState({
    contentDraftId: '',
    finalCaption: '',
    checklist: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const approvedAssets = useMemo(
    () => assets.filter(asset => asset.reviewStatus === 'approved'),
    [assets],
  )
  const draftedAssetIds = new Set(drafts.map(draft => draft.generatedAssetId))
  const draftlessApprovedAssets = approvedAssets.filter(asset => !draftedAssetIds.has(asset.id))
  const activeAccount = channelState?.items.find(item => item.isActive) || null

  async function loadData() {
    if (!session) {
      return
    }

    setLoading(true)
    try {
      const [assetData, draftData, packageData, nextChannelState] = await Promise.all([
        studioFetch('/studio/v1/generated-assets', assetListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/content-drafts', draftListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/publish-packages', publishPackageListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/channel-account', studioChannelAccountStateSchema, {}, session.token, apiBase),
      ])

      setAssets(assetData)
      setDrafts(draftData)
      setPackages(packageData)
      setChannelState(nextChannelState)
      setDraftForm(current => ({
        ...current,
        generatedAssetId: current.generatedAssetId || assetData.find(asset => asset.reviewStatus === 'approved')?.id || '',
      }))
      setPackageForm(current => ({
        ...current,
        contentDraftId: current.contentDraftId || draftData[0]?.id || '',
      }))
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load publish workspace')
    }
    finally {
      setLoading(false)
    }
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSaving(true)
    try {
      const payload = createStudioContentDraftRequestSchema.parse({
        generatedAssetId: draftForm.generatedAssetId,
        captionOptions: splitLineSeparated(draftForm.captionOptions),
        hashtags: splitCommaSeparated(draftForm.hashtags),
        cta: draftForm.cta,
        publishNote: draftForm.publishNote,
        status: 'draft',
      })

      await studioFetch('/studio/v1/content-drafts', studioContentDraftSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setDraftForm({
        generatedAssetId: '',
        captionOptions: '',
        hashtags: '',
        cta: '',
        publishNote: '',
      })
      setError('')
      await loadData()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create draft')
    }
    finally {
      setSaving(false)
    }
  }

  async function createPublishPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSaving(true)
    try {
      const payload = createStudioPublishPackageRequestSchema.parse({
        contentDraftId: packageForm.contentDraftId,
        finalCaption: packageForm.finalCaption || undefined,
        checklist: splitLineSeparated(packageForm.checklist),
      })

      await studioFetch('/studio/v1/publish-packages', studioPublishPackageSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setPackageForm({
        contentDraftId: '',
        finalCaption: '',
        checklist: '',
      })
      setError('')
      await loadData()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create publish package')
    }
    finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [session, apiBase])

  return (
    <FactoryShell
      title="Publish"
      subtitle="Turn approved assets into reviewable captions and export one manual posting package for the active X account."
    >
      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Active posting target</h3>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
              Packages can only be exported when one X account is active.
            </p>
          </div>
          <div style={statusChipStyle(activeAccount ? 'success' : 'danger')}>
            {activeAccount ? `X ready: ${activeAccount.credentialSummary.nickname}` : 'No active X account'}
          </div>
        </div>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="Loading publish workspace..." />
        : (
            <>
              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Create content draft</h3>
                <form onSubmit={createDraft} style={{ display: 'grid', gap: 14 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Approved asset</span>
                    <select value={draftForm.generatedAssetId} onChange={event => setDraftForm(current => ({ ...current, generatedAssetId: event.target.value }))} style={fieldStyle} required>
                      <option value="">Select approved asset</option>
                      {draftlessApprovedAssets.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.assetId}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Caption options</span>
                    <textarea
                      value={draftForm.captionOptions}
                      onChange={event => setDraftForm(current => ({ ...current, captionOptions: event.target.value }))}
                      rows={5}
                      style={fieldStyle}
                      placeholder={'one line per caption option\nsoft morning light and a quiet stare'}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Hashtags</span>
                    <input
                      value={draftForm.hashtags}
                      onChange={event => setDraftForm(current => ({ ...current, hashtags: event.target.value }))}
                      placeholder="#AIBeauty,#XDaily"
                      style={fieldStyle}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>CTA</span>
                    <input value={draftForm.cta} onChange={event => setDraftForm(current => ({ ...current, cta: event.target.value }))} style={fieldStyle} />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Publish note</span>
                    <textarea value={draftForm.publishNote} onChange={event => setDraftForm(current => ({ ...current, publishNote: event.target.value }))} rows={3} style={fieldStyle} />
                  </label>
                  <button type="submit" style={primaryButtonStyle} disabled={saving || !draftForm.generatedAssetId}>
                    {saving ? 'Saving...' : 'Create draft'}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Export publish package</h3>
                <form onSubmit={createPublishPackage} style={{ display: 'grid', gap: 14 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Content draft</span>
                    <select value={packageForm.contentDraftId} onChange={event => setPackageForm(current => ({ ...current, contentDraftId: event.target.value }))} style={fieldStyle} required>
                      <option value="">Select draft</option>
                      {drafts.map(draft => (
                        <option key={draft.id} value={draft.id}>{draft.generatedAssetId.slice(-8)} · {draft.status}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Final caption</span>
                    <textarea value={packageForm.finalCaption} onChange={event => setPackageForm(current => ({ ...current, finalCaption: event.target.value }))} rows={4} style={fieldStyle} />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Checklist</span>
                    <textarea
                      value={packageForm.checklist}
                      onChange={event => setPackageForm(current => ({ ...current, checklist: event.target.value }))}
                      rows={4}
                      style={fieldStyle}
                      placeholder={'one line per checklist item\nconfirm crop\npaste tracking URL'}
                    />
                  </label>
                  <button type="submit" style={primaryButtonStyle} disabled={saving || !packageForm.contentDraftId}>
                    {saving ? 'Saving...' : 'Create publish package'}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Content drafts</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {drafts.map(draft => (
                    <article key={draft.id} style={softCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <strong>{draft.generatedAssetId}</strong>
                          <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                            {draft.captionOptions.length > 0 ? draft.captionOptions[0] : 'No caption option'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', color: 'var(--muted)' }}>
                          <div>{draft.status}</div>
                          <div style={{ marginTop: 4 }}>Updated {formatDateTime(draft.updatedAt)}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>{draft.hashtags.join(' ')}</div>
                    </article>
                  ))}
                  {drafts.length === 0 && (
                    <div style={softCardStyle}>No content drafts yet.</div>
                  )}
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Publish packages</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {packages.map(item => (
                    <article key={item.id} style={softCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ maxWidth: 780 }}>
                          <strong>{item.status}</strong>
                          <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.finalCaption}</div>
                        </div>
                        <div style={{ color: 'var(--muted)', textAlign: 'right' }}>
                          <div>{formatDateTime(item.exportedAt)}</div>
                          <div style={{ marginTop: 4 }}>{item.assetRefs.length} asset ref(s)</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 12 }}>
                        {item.assetRefs.map(assetRef => (
                          <div key={assetRef.assetId} style={softCardStyle}>
                            <img
                              src={assetRef.previewUrl}
                              alt={assetRef.assetId}
                              style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: 16, border: '1px solid var(--line)' }}
                            />
                            <div style={{ marginTop: 8 }}>{assetRef.assetId}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 12 }}>
                        {item.checklist.map(check => (
                          <div key={check} style={{ color: 'var(--muted)', marginTop: 4 }}>- {check}</div>
                        ))}
                      </div>
                    </article>
                  ))}
                  {packages.length === 0 && (
                    <div style={softCardStyle}>No publish packages yet.</div>
                  )}
                </div>
              </section>
            </>
          )}
    </FactoryShell>
  )
}
