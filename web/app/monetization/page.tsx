'use client'

import { useEffect, useState } from 'react'
import { cardStyle, FactoryShell, LoadingSpinner, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'

interface MonetizationItem {
  _id: string
  recordDate: string
  platform: string
  characterCode: string
  revenue: number
  tier: string
}

export default function MonetizationPage() {
  const { apiBase, session } = useFactory()
  const [records, setRecords] = useState<MonetizationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadRecords() {
    if (!session) return
    setLoading(true)
    try {
      const data = await factoryFetch<MonetizationItem[]>('/factory/beauty-monetization', {}, session.token, apiBase)
      setRecords(data)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load monetization records')
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [session])

  return (
    <FactoryShell title="配信・収益実績" subtitle="Fanvue等のプラットフォームごとの売上・コンバージョン実績をキャラ別にレポートします。">
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading ? (
        <LoadingSpinner label="収益データを読み込んでいます…" />
      ) : (
        <section style={{ display: 'grid', gap: 16 }}>
          {records.map(record => (
            <article key={record._id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--brand)' }}>{new Date(record.recordDate).toLocaleDateString()}</div>
                  <h3 style={{ margin: '4px 0 0', fontFamily: 'var(--font-display), sans-serif' }}>{record.characterCode}</h3>
                </div>
                <div style={{ ...softCardStyle, textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{record.platform} ({record.tier})</div>
                  <strong style={{ fontSize: 18 }}>¥{record.revenue.toLocaleString()}</strong>
                </div>
              </div>
            </article>
          ))}
          {records.length === 0 && (
            <section style={cardStyle}>まだ収益データが記録されていません。</section>
          )}
        </section>
      )}
    </FactoryShell>
  )
}
