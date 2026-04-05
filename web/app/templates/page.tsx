'use client'

import { useEffect, useState } from 'react'
import { cardStyle, FactoryShell, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'

interface TemplateItem {
  _id: string
  templateId: string
  category: string
  name: string
  description: string
  basePrompt: string
}

export default function TemplatesPage() {
  const { apiBase, session } = useFactory()
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadTemplates() {
    if (!session) return
    setLoading(true)
    try {
      const data = await factoryFetch<TemplateItem[]>('/factory/beauty-templates', {}, session.token, apiBase)
      setTemplates(data)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load templates')
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTemplates()
  }, [session])

  return (
    <FactoryShell title="テンプレート管理" subtitle="画像生成のプロンプトデータベース（シーン・衣装・アングル等のテンプレ）です。">
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading ? (
        <LoadingSpinner label="テンプレート情報を読み込んでいます…" />
      ) : (
        <section style={{ display: 'grid', gap: 16 }}>
          {templates.map(tmp => (
            <article key={tmp._id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)' }}>{tmp.category}</div>
                  <h3 style={{ margin: '8px 0 4px', fontFamily: 'var(--font-display), sans-serif' }}>{tmp.name}</h3>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>{tmp.description}</div>
                </div>
              </div>
            </article>
          ))}
          {templates.length === 0 && (
            <section style={cardStyle}>テンプレートが登録されていません。</section>
          )}
        </section>
      )}
    </FactoryShell>
  )
}
