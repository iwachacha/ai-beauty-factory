'use client'

import { useEffect, useState } from 'react'
import { cardStyle, FactoryShell, LoadingSpinner, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'

interface CalendarItem {
  _id: string
  characterCode: string
  scheduleDate: string
  postType: string
  sceneTemplateId: string
  tier: string
}

export default function CalendarPage() {
  const { apiBase, session } = useFactory()
  const [calendar, setCalendar] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadCalendar() {
    if (!session) return
    setLoading(true)
    try {
      const data = await factoryFetch<CalendarItem[]>('/factory/beauty-calendar', {}, session.token, apiBase)
      setCalendar(data)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load calendar')
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCalendar()
  }, [session])

  return (
    <FactoryShell title="配信カレンダー" subtitle="生成・投稿予定のスケジュール。キャラ別・日別にどんなコンテンツを展開するか一覧します。">
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading ? (
        <LoadingSpinner label="カレンダーを読み込んでいます…" />
      ) : (
        <section style={{ display: 'grid', gap: 16 }}>
          {calendar.map(event => (
            <article key={event._id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display), sans-serif' }}>
                    {new Date(event.scheduleDate).toLocaleDateString()}
                  </h3>
                  <div style={{ color: 'var(--brand)', fontSize: 14 }}>{event.characterCode}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ ...softCardStyle, fontSize: 13, padding: '6px 12px' }}>{event.tier}</div>
                  <div style={{ ...softCardStyle, fontSize: 13, padding: '6px 12px' }}>{event.postType}</div>
                </div>
              </div>
            </article>
          ))}
          {calendar.length === 0 && (
            <section style={cardStyle}>スケジュールが登録されていません。</section>
          )}
        </section>
      )}
    </FactoryShell>
  )
}
