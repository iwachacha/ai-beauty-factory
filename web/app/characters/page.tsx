'use client'

import { useEffect, useState } from 'react'
import { cardStyle, FactoryShell, LoadingSpinner, primaryButtonStyle, softCardStyle, fieldStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'

interface CharacterItem {
  _id: string
  code: string
  name: string
  nationality: string
  occupation: string
  tierFocus: string[]
  createdAt: string
}

export default function CharactersPage() {
  const { apiBase, session } = useFactory()
  const [characters, setCharacters] = useState<CharacterItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadCharacters() {
    if (!session) return
    setLoading(true)
    try {
      const data = await factoryFetch<CharacterItem[]>('/factory/beauty-characters', {}, session.token, apiBase)
      setCharacters(data)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load characters')
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCharacters()
  }, [session])

  return (
    <FactoryShell title="AIキャラクター管理" subtitle="各キャラクターの基本設定・属性を管理します。設定されたキャラごとに一貫したモデル・LoRAが適用されます。">
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading ? (
        <LoadingSpinner label="キャラクター情報を読み込んでいます…" />
      ) : (
        <section style={{ display: 'grid', gap: 16 }}>
          {characters.map(character => (
            <article key={character._id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)' }}>{character.code}</div>
                  <h3 style={{ margin: '8px 0 4px', fontFamily: 'var(--font-display), sans-serif' }}>{character.name}</h3>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>{character.nationality} / {character.occupation}</div>
                </div>
                <div style={{ ...softCardStyle, minWidth: 120 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>主適正層</div>
                  <strong style={{ fontSize: 14 }}>{character.tierFocus.join(', ')}</strong>
                </div>
              </div>
            </article>
          ))}
          {characters.length === 0 && (
            <section style={cardStyle}>キャラクターが登録されていません。</section>
          )}
        </section>
      )}
    </FactoryShell>
  )
}
