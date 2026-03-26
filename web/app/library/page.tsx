'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { cardStyle, FactoryShell, primaryButtonStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'

interface ContentAsset {
  id: string
  title: string
  body: string
  topics: string[]
  contentType: string
}

export default function LibraryPage() {
  const { apiBase, session } = useFactory()
  const [assets, setAssets] = useState<ContentAsset[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [topics, setTopics] = useState('')
  const [contentType, setContentType] = useState('text')
  const [error, setError] = useState('')

  async function loadAssets() {
    if (!session) {
      return
    }
    try {
      const data = await factoryFetch<ContentAsset[]>('/content/assets', {}, session.token, apiBase)
      setAssets(data)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load assets')
    }
  }

  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }
    try {
      await factoryFetch('/content/assets', {
        method: 'POST',
        body: JSON.stringify({
          title,
          body,
          topics: topics.split(',').map(item => item.trim()).filter(Boolean),
          contentType,
          mediaRefs: [],
        }),
      }, session.token, apiBase)
      setTitle('')
      setBody('')
      setTopics('')
      setContentType('text')
      setError('')
      await loadAssets()
    }
    catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to save asset')
    }
  }

  useEffect(() => {
    void loadAssets()
  }, [session])

  return (
    <FactoryShell title="Library" subtitle="Store reusable text, image, or video drafts before assigning them to flows.">
      <section style={cardStyle}>
        <form onSubmit={createAsset} style={{ display: 'grid', gap: 14 }}>
          <input placeholder="Title" value={title} onChange={event => setTitle(event.target.value)} style={fieldStyle} />
          <textarea placeholder="Body" value={body} onChange={event => setBody(event.target.value)} rows={6} style={fieldStyle} />
          <input placeholder="Topics, comma separated" value={topics} onChange={event => setTopics(event.target.value)} style={fieldStyle} />
          <select value={contentType} onChange={event => setContentType(event.target.value)} style={fieldStyle}>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="mixed">Mixed</option>
          </select>
          <button type="submit" style={primaryButtonStyle}>Save asset</button>
        </form>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      <section style={{ display: 'grid', gap: 16 }}>
        {assets.map(asset => (
          <article key={asset.id} style={cardStyle}>
            <div style={{ fontSize: 12, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{asset.contentType}</div>
            <h3 style={{ margin: '8px 0', fontFamily: 'var(--font-display), sans-serif' }}>{asset.title}</h3>
            <p style={{ margin: 0, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{asset.body || 'No body yet.'}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {asset.topics.map(topic => (
                <span key={topic} style={tagStyle}>#{topic}</span>
              ))}
            </div>
          </article>
        ))}
        {assets.length === 0 && <section style={cardStyle}>No assets yet.</section>}
      </section>
    </FactoryShell>
  )
}

const fieldStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid var(--line)',
  background: 'white',
}

const tagStyle: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 999,
  background: 'rgba(217, 119, 69, 0.12)',
  color: 'var(--brand)',
  fontSize: 13,
}
