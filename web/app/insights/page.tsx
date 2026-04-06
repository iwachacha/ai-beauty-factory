'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, fieldStyle, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import {
  createStudioPublishedPostRequestSchema,
  studioInsightsResponseSchema,
  studioPublishedPostSchema,
} from '../../lib/studio-contracts'
import { studioFetch } from '../../lib/studio-api'
import { formatDateTime, formatNumber } from '../../lib/studio-ui'

export default function InsightsPage() {
  const { apiBase, session } = useFactory()
  const [insights, setInsights] = useState<z.infer<typeof studioInsightsResponseSchema> | null>(null)
  const [form, setForm] = useState({
    publishPackageId: '',
    platformPostUrl: '',
    publishedAt: '',
    impressions: '0',
    likes: '0',
    reposts: '0',
    replies: '0',
    bookmarks: '0',
    profileVisits: '0',
    linkClicks: '0',
    operatorMemo: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadInsights() {
    if (!session) {
      return
    }

    setLoading(true)
    try {
      const data = await studioFetch('/studio/v1/insights', studioInsightsResponseSchema, {}, session.token, apiBase)
      setInsights(data)
      setForm(current => ({
        ...current,
        publishPackageId: current.publishPackageId || data.pendingPublishPackages[0]?.id || '',
      }))
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load insights')
    }
    finally {
      setLoading(false)
    }
  }

  async function recordPublishedPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSaving(true)
    try {
      const payload = createStudioPublishedPostRequestSchema.parse({
        publishPackageId: form.publishPackageId,
        platformPostUrl: form.platformPostUrl,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
        manualMetrics: {
          impressions: Number(form.impressions || 0),
          likes: Number(form.likes || 0),
          reposts: Number(form.reposts || 0),
          replies: Number(form.replies || 0),
          bookmarks: Number(form.bookmarks || 0),
          profileVisits: Number(form.profileVisits || 0),
          linkClicks: Number(form.linkClicks || 0),
        },
        operatorMemo: form.operatorMemo,
      })

      await studioFetch('/studio/v1/published-posts', studioPublishedPostSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setForm({
        publishPackageId: '',
        platformPostUrl: '',
        publishedAt: '',
        impressions: '0',
        likes: '0',
        reposts: '0',
        replies: '0',
        bookmarks: '0',
        profileVisits: '0',
        linkClicks: '0',
        operatorMemo: '',
      })
      setError('')
      await loadInsights()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to record published post')
    }
    finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    void loadInsights()
  }, [session, apiBase])

  return (
    <FactoryShell
      title="Insights"
      subtitle="Log the manual post result, keep metrics together, and build feedback loops for the next generation cycle."
    >
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="Loading insights..." />
        : (
            <>
              <section style={cardStyle}>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Posts</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalPosts || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Impressions</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalImpressions || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Likes</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalLikes || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Reposts</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalReposts || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Bookmarks</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalBookmarks || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Profile visits</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalProfileVisits || 0)}</strong>
                  </div>
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Record published post</h3>
                <form onSubmit={recordPublishedPost} style={{ display: 'grid', gap: 14 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Publish package</span>
                    <select value={form.publishPackageId} onChange={event => setForm(current => ({ ...current, publishPackageId: event.target.value }))} style={fieldStyle} required>
                      <option value="">Select publish package</option>
                      {(insights?.pendingPublishPackages || []).map(item => (
                        <option key={item.id} value={item.id}>{item.id.slice(-8)} · {item.status}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Post URL</span>
                    <input value={form.platformPostUrl} onChange={event => setForm(current => ({ ...current, platformPostUrl: event.target.value }))} style={fieldStyle} required />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Published at</span>
                    <input type="datetime-local" value={form.publishedAt} onChange={event => setForm(current => ({ ...current, publishedAt: event.target.value }))} style={fieldStyle} />
                  </label>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    {[
                      ['impressions', 'Impressions'],
                      ['likes', 'Likes'],
                      ['reposts', 'Reposts'],
                      ['replies', 'Replies'],
                      ['bookmarks', 'Bookmarks'],
                      ['profileVisits', 'Profile visits'],
                      ['linkClicks', 'Link clicks'],
                    ].map(([key, label]) => (
                      <label key={key} style={{ display: 'grid', gap: 8 }}>
                        <span>{label}</span>
                        <input
                          type="number"
                          min={0}
                          value={form[key as keyof typeof form]}
                          onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))}
                          style={fieldStyle}
                        />
                      </label>
                    ))}
                  </div>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Operator memo</span>
                    <textarea value={form.operatorMemo} onChange={event => setForm(current => ({ ...current, operatorMemo: event.target.value }))} rows={4} style={fieldStyle} />
                  </label>
                  <button type="submit" style={primaryButtonStyle} disabled={saving || !form.publishPackageId}>
                    {saving ? 'Saving...' : 'Record published post'}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Pending publish packages</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(insights?.pendingPublishPackages || []).map(item => (
                    <article key={item.id} style={softCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <strong>{item.id}</strong>
                          <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.finalCaption}</div>
                        </div>
                        <div style={{ color: 'var(--muted)' }}>Exported {formatDateTime(item.exportedAt)}</div>
                      </div>
                    </article>
                  ))}
                  {(insights?.pendingPublishPackages.length || 0) === 0 && (
                    <div style={softCardStyle}>No pending publish packages.</div>
                  )}
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Published posts</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(insights?.items || []).map(item => (
                    <article key={item.id} style={softCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ maxWidth: 760 }}>
                          <a href={item.platformPostUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                            {item.platformPostUrl}
                          </a>
                          <div style={{ color: 'var(--muted)', marginTop: 8 }}>Published {formatDateTime(item.publishedAt)}</div>
                          {item.operatorMemo && <div style={{ marginTop: 8 }}>{item.operatorMemo}</div>}
                        </div>
                        <div style={{ textAlign: 'right', color: 'var(--muted)' }}>
                          <div>Impressions {formatNumber(item.manualMetrics.impressions)}</div>
                          <div>Likes {formatNumber(item.manualMetrics.likes)}</div>
                          <div>Reposts {formatNumber(item.manualMetrics.reposts)}</div>
                        </div>
                      </div>
                    </article>
                  ))}
                  {(insights?.items.length || 0) === 0 && (
                    <div style={softCardStyle}>No published posts recorded yet.</div>
                  )}
                </div>
              </section>
            </>
          )}
    </FactoryShell>
  )
}
