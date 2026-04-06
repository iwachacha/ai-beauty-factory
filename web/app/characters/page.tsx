'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, fieldStyle, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import {
  createStudioCharacterRequestSchema,
  studioCharacterProfileSchema,
} from '../../lib/studio-contracts'
import { studioFetch } from '../../lib/studio-api'
import {
  formatDateTime,
  splitCommaSeparated,
  studioEntityStatusOptions,
  studioTierOptions,
} from '../../lib/studio-ui'

const characterListSchema = z.array(studioCharacterProfileSchema)

type CharacterFormState = {
  code: string
  displayName: string
  personaSummary: string
  nationality: string
  profession: string
  styleNotes: string
  defaultTier: 'free_sns' | 'subscriber' | 'premium'
  faceReferenceAssetIds: string
  status: 'draft' | 'active' | 'archived'
}

const initialForm: CharacterFormState = {
  code: '',
  displayName: '',
  personaSummary: '',
  nationality: '',
  profession: '',
  styleNotes: '',
  defaultTier: 'free_sns',
  faceReferenceAssetIds: '',
  status: 'active',
}

export default function CharactersPage() {
  const { apiBase, session } = useFactory()
  const [characters, setCharacters] = useState<z.infer<typeof studioCharacterProfileSchema>[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)

  async function loadCharacters() {
    if (!session) {
      return
    }

    setLoading(true)
    try {
      const data = await studioFetch('/studio/v1/characters', characterListSchema, {}, session.token, apiBase)
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

  async function saveCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSaving(true)
    try {
      const payload = createStudioCharacterRequestSchema.parse({
        code: form.code,
        displayName: form.displayName,
        personaSummary: form.personaSummary,
        nationality: form.nationality,
        profession: form.profession,
        styleNotes: splitCommaSeparated(form.styleNotes),
        defaultTier: form.defaultTier,
        faceReferenceAssetIds: splitCommaSeparated(form.faceReferenceAssetIds),
        status: form.status,
      })

      await studioFetch('/studio/v1/characters', studioCharacterProfileSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setForm(initialForm)
      setError('')
      await loadCharacters()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save character')
    }
    finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    void loadCharacters()
  }, [session, apiBase])

  return (
    <FactoryShell
      title="Characters"
      subtitle="Define one strong persona at a time. Every generation run pulls from these identity settings."
    >
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Create character profile</h3>
        <form onSubmit={saveCharacter} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Code</span>
              <input value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} style={fieldStyle} required />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Display name</span>
              <input value={form.displayName} onChange={event => setForm(current => ({ ...current, displayName: event.target.value }))} style={fieldStyle} required />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Nationality</span>
              <input value={form.nationality} onChange={event => setForm(current => ({ ...current, nationality: event.target.value }))} style={fieldStyle} required />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Profession</span>
              <input value={form.profession} onChange={event => setForm(current => ({ ...current, profession: event.target.value }))} style={fieldStyle} required />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Default tier</span>
              <select value={form.defaultTier} onChange={event => setForm(current => ({ ...current, defaultTier: event.target.value as typeof form.defaultTier }))} style={fieldStyle}>
                {studioTierOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Status</span>
              <select value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value as typeof form.status }))} style={fieldStyle}>
                {studioEntityStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>Persona summary</span>
            <textarea
              value={form.personaSummary}
              onChange={event => setForm(current => ({ ...current, personaSummary: event.target.value }))}
              rows={4}
              style={fieldStyle}
              required
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>Style notes</span>
            <input
              value={form.styleNotes}
              onChange={event => setForm(current => ({ ...current, styleNotes: event.target.value }))}
              placeholder="soft glam, candid framing, sunlit skin"
              style={fieldStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>Face reference asset IDs</span>
            <input
              value={form.faceReferenceAssetIds}
              onChange={event => setForm(current => ({ ...current, faceReferenceAssetIds: event.target.value }))}
              placeholder="asset_face_001, asset_face_002"
              style={fieldStyle}
            />
          </label>

          <button type="submit" style={primaryButtonStyle} disabled={saving}>
            {saving ? 'Saving...' : 'Save character'}
          </button>
        </form>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="Loading character profiles..." />
        : (
            <section style={{ display: 'grid', gap: 16 }}>
              {characters.map(character => (
                <article key={character.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)' }}>{character.code}</div>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display), sans-serif' }}>{character.displayName}</h3>
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{character.nationality} · {character.profession}</div>
                    </div>
                    <div style={{ ...softCardStyle, minWidth: 180 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Default tier</div>
                      <strong>{character.defaultTier}</strong>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Updated {formatDateTime(character.updatedAt)}</div>
                    </div>
                  </div>
                  <p style={{ margin: '16px 0 0', color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{character.personaSummary}</p>
                  <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 16 }}>
                    <div style={softCardStyle}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Style notes</div>
                      <div style={{ marginTop: 8 }}>{character.styleNotes.length > 0 ? character.styleNotes.join(', ') : 'No style notes yet'}</div>
                    </div>
                    <div style={softCardStyle}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Face references</div>
                      <div style={{ marginTop: 8 }}>{character.faceReferenceAssetIds.length > 0 ? character.faceReferenceAssetIds.join(', ') : 'No references yet'}</div>
                    </div>
                    <div style={softCardStyle}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Status</div>
                      <div style={{ marginTop: 8 }}>{character.status}</div>
                    </div>
                  </div>
                </article>
              ))}
              {characters.length === 0 && (
                <section style={cardStyle}>
                  No character profiles yet. Start by defining the persona you want to keep consistent across generations.
                </section>
              )}
            </section>
          )}
    </FactoryShell>
  )
}
