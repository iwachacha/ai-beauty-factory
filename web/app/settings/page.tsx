'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { cardStyle, FactoryShell, fieldStyle, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'

interface ApiKeyItem {
  id: string
  name: string
  createdAt: string
}

export default function SettingsPage() {
  const { apiBase, setApiBase, session } = useFactory()
  const [draftApiBase, setDraftApiBase] = useState(apiBase)
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [name, setName] = useState('')
  const [lastCreatedKey, setLastCreatedKey] = useState('')
  const [error, setError] = useState('')

  async function loadKeys() {
    if (!session) {
      return
    }
    try {
      const data = await factoryFetch<ApiKeyItem[]>('/settings/api-keys', {}, session.token, apiBase)
      setApiKeys(data)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load API keys')
    }
  }

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }
    try {
      const result = await factoryFetch<{ key: string }>('/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }, session.token, apiBase)
      setLastCreatedKey(result.key)
      setName('')
      setError('')
      await loadKeys()
    }
    catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create API key')
    }
  }

  async function deleteKey(id: string) {
    if (!session) {
      return
    }
    try {
      await factoryFetch(`/settings/api-keys/${id}`, {
        method: 'DELETE',
      }, session.token, apiBase)
      setError('')
      await loadKeys()
    }
    catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete API key')
    }
  }

  useEffect(() => {
    void loadKeys()
  }, [session, apiBase])

  return (
    <FactoryShell title="システム設定" subtitle="APIのベースURL設定や、外部連携用のAPIアクセスキーを管理します。">
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>API エンドポイント</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input value={draftApiBase} onChange={event => setDraftApiBase(event.target.value)} style={{ ...fieldStyle, flex: 1 }} />
          <button onClick={() => setApiBase(draftApiBase)} style={primaryButtonStyle}>保存</button>
        </div>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>API アクセスキー</h3>
        <form onSubmit={createKey} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <input value={name} onChange={event => setName(event.target.value)} placeholder="新しいキーの名前" style={{ ...fieldStyle, flex: 1 }} />
          <button type="submit" style={primaryButtonStyle}>キーを生成</button>
        </form>
        {lastCreatedKey && <div style={{ ...softCardStyle, marginBottom: 16 }}>新規生成されたキー（一度しか表示されません）: <code>{lastCreatedKey}</code></div>}
        <div style={{ display: 'grid', gap: 12 }}>
          {apiKeys.map(apiKey => (
            <article key={apiKey.id} style={softCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <strong>{apiKey.name}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{new Date(apiKey.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={() => void deleteKey(apiKey.id)} style={primaryButtonStyle}>削除</button>
              </div>
            </article>
          ))}
          {apiKeys.length === 0 && <div style={softCardStyle}>作成されたAPIキーはありません。</div>}
        </div>
      </section>
    </FactoryShell>
  )
}

