'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, fieldStyle, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import {
  createStudioTemplateRequestSchema,
  studioPromptTemplateSchema,
} from '../../lib/studio-contracts'
import { studioFetch } from '../../lib/studio-api'
import {
  formatDateTime,
  splitCommaSeparated,
  splitLineSeparated,
  studioEntityStatusOptions,
  studioTierOptions,
} from '../../lib/studio-ui'

const templateListSchema = z.array(studioPromptTemplateSchema)

type TemplateFormState = {
  code: string
  scene: string
  intent: string
  outfitTags: string
  fetishTags: string
  positiveBlocks: string
  negativeBlocks: string
  tierSuitability: Array<'free_sns' | 'subscriber' | 'premium'>
  status: 'draft' | 'active' | 'archived'
}

const initialForm: TemplateFormState = {
  code: '',
  scene: '',
  intent: '',
  outfitTags: '',
  fetishTags: '',
  positiveBlocks: '',
  negativeBlocks: '',
  tierSuitability: ['free_sns'],
  status: 'active',
}

export default function TemplatesPage() {
  const { apiBase, session } = useFactory()
  const [templates, setTemplates] = useState<z.infer<typeof studioPromptTemplateSchema>[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)

  async function loadTemplates() {
    if (!session) {
      return
    }

    setLoading(true)
    try {
      const data = await studioFetch('/studio/v1/templates', templateListSchema, {}, session.token, apiBase)
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

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSaving(true)
    try {
      const payload = createStudioTemplateRequestSchema.parse({
        code: form.code,
        scene: form.scene,
        intent: form.intent,
        outfitTags: splitCommaSeparated(form.outfitTags),
        fetishTags: splitCommaSeparated(form.fetishTags),
        tierSuitability: form.tierSuitability,
        positiveBlocks: splitLineSeparated(form.positiveBlocks),
        negativeBlocks: splitLineSeparated(form.negativeBlocks),
        status: form.status,
      })

      await studioFetch('/studio/v1/templates', studioPromptTemplateSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setForm(initialForm)
      setError('')
      await loadTemplates()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save template')
    }
    finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    void loadTemplates()
  }, [session, apiBase])

  return (
    <FactoryShell
      title="Templates"
      subtitle="Turn scene and intent into reusable prompt blocks so quality improves through repetition."
    >
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Create prompt template</h3>
        <form onSubmit={saveTemplate} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Code</span>
              <input value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} style={fieldStyle} required />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Scene</span>
              <input value={form.scene} onChange={event => setForm(current => ({ ...current, scene: event.target.value }))} style={fieldStyle} required />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Intent</span>
              <input value={form.intent} onChange={event => setForm(current => ({ ...current, intent: event.target.value }))} style={fieldStyle} required />
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
            <span>Outfit tags</span>
            <input
              value={form.outfitTags}
              onChange={event => setForm(current => ({ ...current, outfitTags: event.target.value }))}
              placeholder="silk robe, lace dress, office shirt"
              style={fieldStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>Fetish tags</span>
            <input
              value={form.fetishTags}
              onChange={event => setForm(current => ({ ...current, fetishTags: event.target.value }))}
              placeholder="legs, wet hair, mirror angle"
              style={fieldStyle}
            />
          </label>

          <div style={{ display: 'grid', gap: 8 }}>
            <span>Tier suitability</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {studioTierOptions.map(option => {
                const checked = form.tierSuitability.includes(option.value)
                return (
                  <label key={option.value} style={{ ...softCardStyle, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setForm((current) => {
                          const next = event.target.checked
                            ? [...current.tierSuitability, option.value]
                            : current.tierSuitability.filter(item => item !== option.value)
                          return {
                            ...current,
                            tierSuitability: next.length > 0 ? next : ['free_sns'],
                          }
                        })
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>Positive blocks</span>
            <textarea
              value={form.positiveBlocks}
              onChange={event => setForm(current => ({ ...current, positiveBlocks: event.target.value }))}
              rows={6}
              style={fieldStyle}
              placeholder={'one line per block\ncinematic photography\nnatural skin detail'}
              required
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>Negative blocks</span>
            <textarea
              value={form.negativeBlocks}
              onChange={event => setForm(current => ({ ...current, negativeBlocks: event.target.value }))}
              rows={5}
              style={fieldStyle}
              placeholder={'one line per block\nextra fingers\nblurry eyes'}
            />
          </label>

          <button type="submit" style={primaryButtonStyle} disabled={saving}>
            {saving ? 'Saving...' : 'Save template'}
          </button>
        </form>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="Loading templates..." />
        : (
            <section style={{ display: 'grid', gap: 16 }}>
              {templates.map(template => (
                <article key={template.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)' }}>{template.code}</div>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display), sans-serif' }}>{template.scene}</h3>
                      <div style={{ color: 'var(--muted)' }}>{template.intent}</div>
                    </div>
                    <div style={{ ...softCardStyle, minWidth: 180 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Suitability</div>
                      <strong>{template.tierSuitability.join(', ')}</strong>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Updated {formatDateTime(template.updatedAt)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 16 }}>
                    <div style={softCardStyle}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Outfit tags</div>
                      <div style={{ marginTop: 8 }}>{template.outfitTags.length > 0 ? template.outfitTags.join(', ') : 'No outfit tags yet'}</div>
                    </div>
                    <div style={softCardStyle}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Fetish tags</div>
                      <div style={{ marginTop: 8 }}>{template.fetishTags.length > 0 ? template.fetishTags.join(', ') : 'No fetish tags yet'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 16 }}>
                    <div style={softCardStyle}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Positive blocks</div>
                      <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{template.positiveBlocks.join('\n')}</div>
                    </div>
                    <div style={softCardStyle}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Negative blocks</div>
                      <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                        {template.negativeBlocks.length > 0 ? template.negativeBlocks.join('\n') : 'No negative blocks yet'}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {templates.length === 0 && (
                <section style={cardStyle}>
                  No templates yet. Add reusable prompt blocks before starting generation runs.
                </section>
              )}
            </section>
          )}
    </FactoryShell>
  )
}
