'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, fieldStyle, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import {
  createStudioFunnelMetricsRequestSchema,
  studioInsightsResponseSchema,
} from '../../lib/studio-contracts'
import { studioFetch } from '../../lib/studio-api'
import { formatCurrency, formatDateTime, formatNumber } from '../../lib/studio-ui'

export default function InsightsPage() {
  const { apiBase, session } = useFactory()
  const [insights, setInsights] = useState<z.infer<typeof studioInsightsResponseSchema> | null>(null)
  const [form, setForm] = useState({
    publicPostPackageId: '',
    paidOfferPackageId: '',
    publicPostUrl: '',
    impressions: '0',
    likes: '0',
    reposts: '0',
    replies: '0',
    bookmarks: '0',
    profileVisits: '0',
    linkClicks: '0',
    landingVisits: '0',
    subscriberConversions: '0',
    renewals: '0',
    revenue: '0',
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
        publicPostPackageId: current.publicPostPackageId || data.pendingPublicPostPackages[0]?.id || '',
        paidOfferPackageId: current.paidOfferPackageId || data.pendingPaidOfferPackages[0]?.id || '',
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

  async function recordFunnelMetrics(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSaving(true)
    try {
      const payload = createStudioFunnelMetricsRequestSchema.parse({
        publicPostPackageId: form.publicPostPackageId,
        paidOfferPackageId: form.paidOfferPackageId,
        publicPostUrl: form.publicPostUrl || undefined,
        publicMetrics: {
          impressions: Number(form.impressions || 0),
          likes: Number(form.likes || 0),
          reposts: Number(form.reposts || 0),
          replies: Number(form.replies || 0),
          bookmarks: Number(form.bookmarks || 0),
          profileVisits: Number(form.profileVisits || 0),
          linkClicks: Number(form.linkClicks || 0),
        },
        paidMetrics: {
          landingVisits: Number(form.landingVisits || 0),
          subscriberConversions: Number(form.subscriberConversions || 0),
          renewals: Number(form.renewals || 0),
          revenue: Number(form.revenue || 0),
        },
        operatorMemo: form.operatorMemo,
      })

      await studioFetch('/studio/v1/funnel-metrics', z.any(), {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setForm({
        publicPostPackageId: '',
        paidOfferPackageId: '',
        publicPostUrl: '',
        impressions: '0',
        likes: '0',
        reposts: '0',
        replies: '0',
        bookmarks: '0',
        profileVisits: '0',
        linkClicks: '0',
        landingVisits: '0',
        subscriberConversions: '0',
        renewals: '0',
        revenue: '0',
        operatorMemo: '',
      })
      setError('')
      await loadInsights()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to record funnel metrics')
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
      subtitle="Track the public X reaction and the paid Fanvue conversion in one place so the next generation cycle has sharper feedback."
    >
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="Loading insights..." />
        : (
            <>
              <section style={cardStyle}>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Public posts</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalPublicPosts || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Impressions</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalImpressions || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Link clicks</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalLinkClicks || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Landing visits</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalLandingVisits || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Subscriber conversions</div>
                    <strong style={{ fontSize: 28 }}>{formatNumber(insights?.summary.totalSubscriberConversions || 0)}</strong>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Revenue</div>
                    <strong style={{ fontSize: 28 }}>{formatCurrency(insights?.summary.totalRevenue || 0)}</strong>
                  </div>
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Record funnel metrics</h3>
                <form onSubmit={recordFunnelMetrics} style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Public post package</span>
                      <select value={form.publicPostPackageId} onChange={event => setForm(current => ({ ...current, publicPostPackageId: event.target.value }))} style={fieldStyle} required>
                        <option value="">Select public package</option>
                        {(insights?.pendingPublicPostPackages || []).map(item => (
                          <option key={item.id} value={item.id}>{item.id.slice(-8)} - {item.status}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Paid offer package</span>
                      <select value={form.paidOfferPackageId} onChange={event => setForm(current => ({ ...current, paidOfferPackageId: event.target.value }))} style={fieldStyle} required>
                        <option value="">Select paid package</option>
                        {(insights?.pendingPaidOfferPackages || []).map(item => (
                          <option key={item.id} value={item.id}>{item.id.slice(-8)} - {item.status}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Public post URL</span>
                    <input value={form.publicPostUrl} onChange={event => setForm(current => ({ ...current, publicPostUrl: event.target.value }))} style={fieldStyle} />
                  </label>

                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                    {[
                      ['impressions', 'Impressions'],
                      ['likes', 'Likes'],
                      ['reposts', 'Reposts'],
                      ['replies', 'Replies'],
                      ['bookmarks', 'Bookmarks'],
                      ['profileVisits', 'Profile visits'],
                      ['linkClicks', 'Link clicks'],
                      ['landingVisits', 'Landing visits'],
                      ['subscriberConversions', 'Conversions'],
                      ['renewals', 'Renewals'],
                      ['revenue', 'Revenue'],
                    ].map(([key, label]) => (
                      <label key={key} style={{ display: 'grid', gap: 8 }}>
                        <span>{label}</span>
                        <input
                          type="number"
                          min={0}
                          step={key === 'revenue' ? '0.01' : '1'}
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

                  <button type="submit" style={primaryButtonStyle} disabled={saving || !form.publicPostPackageId || !form.paidOfferPackageId}>
                    {saving ? 'Saving metrics...' : 'Record funnel metrics'}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Pending public packages</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(insights?.pendingPublicPostPackages || []).map(item => (
                    <article key={item.id} style={softCardStyle}>
                      <strong>{item.id}</strong>
                      <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.finalCaption}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 8 }}>Exported {formatDateTime(item.exportedAt)}</div>
                    </article>
                  ))}
                  {(insights?.pendingPublicPostPackages.length || 0) === 0 && <div style={softCardStyle}>No pending public packages.</div>}
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Pending paid packages</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(insights?.pendingPaidOfferPackages || []).map(item => (
                    <article key={item.id} style={softCardStyle}>
                      <strong>{item.id}</strong>
                      <div style={{ marginTop: 8 }}>{item.title}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 8 }}>Exported {formatDateTime(item.exportedAt)}</div>
                    </article>
                  ))}
                  {(insights?.pendingPaidOfferPackages.length || 0) === 0 && <div style={softCardStyle}>No pending paid packages.</div>}
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Recorded funnel entries</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(insights?.items || []).map(item => (
                    <article key={item.id} style={softCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ color: 'var(--muted)' }}>Recorded {formatDateTime(item.recordedAt)}</div>
                          {item.publicPostUrl && (
                            <a href={item.publicPostUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                              {item.publicPostUrl}
                            </a>
                          )}
                          {item.operatorMemo && <div style={{ marginTop: 8 }}>{item.operatorMemo}</div>}
                        </div>
                        <div style={{ color: 'var(--muted)', textAlign: 'right' }}>
                          <div>Clicks {formatNumber(item.publicMetrics.linkClicks)}</div>
                          <div>Conversions {formatNumber(item.paidMetrics.subscriberConversions)}</div>
                          <div>Revenue {formatCurrency(item.paidMetrics.revenue)}</div>
                        </div>
                      </div>
                    </article>
                  ))}
                  {(insights?.items.length || 0) === 0 && <div style={softCardStyle}>No funnel metrics recorded yet.</div>}
                </div>
              </section>
            </>
          )}
    </FactoryShell>
  )
}
