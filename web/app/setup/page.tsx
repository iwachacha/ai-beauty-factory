'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, fieldStyle, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import {
  createStudioCharacterRequestSchema,
  createStudioOperatorConfigRequestSchema,
  createStudioTemplateRequestSchema,
  studioCharacterProfileSchema,
  studioOperatorConfigSchema,
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

const characterListSchema = z.array(studioCharacterProfileSchema)
const templateListSchema = z.array(studioPromptTemplateSchema)

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

const initialCharacterForm: CharacterFormState = {
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

const initialTemplateForm: TemplateFormState = {
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

export default function SetupPage() {
  const { apiBase, session } = useFactory()
  const [config, setConfig] = useState<z.infer<typeof studioOperatorConfigSchema> | null>(null)
  const [characters, setCharacters] = useState<z.infer<typeof characterListSchema>>([])
  const [templates, setTemplates] = useState<z.infer<typeof templateListSchema>>([])
  const [characterForm, setCharacterForm] = useState(initialCharacterForm)
  const [templateForm, setTemplateForm] = useState(initialTemplateForm)
  const [loading, setLoading] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingCharacter, setSavingCharacter] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [error, setError] = useState('')

  async function loadData() {
    if (!session) {
      return
    }

    setLoading(true)
    try {
      const [nextConfig, characterData, templateData] = await Promise.all([
        studioFetch('/studio/v1/operator-config', studioOperatorConfigSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/characters', characterListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/templates', templateListSchema, {}, session.token, apiBase),
      ])
      setConfig(nextConfig)
      setCharacters(characterData)
      setTemplates(templateData)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load setup workspace')
    }
    finally {
      setLoading(false)
    }
  }

  async function saveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !config) {
      return
    }

    setSavingConfig(true)
    try {
      const payload = createStudioOperatorConfigRequestSchema.parse({
        defaultCtaLabel: config.defaultCtaLabel,
        defaultCtaUrl: config.defaultCtaUrl,
        defaultPublicHashtags: splitCommaSeparated(config.defaultPublicHashtags.join(', ')),
        defaultPublicChecklist: splitLineSeparated(config.defaultPublicChecklist.join('\n')),
        defaultPaidChecklist: splitLineSeparated(config.defaultPaidChecklist.join('\n')),
        publicGuidelines: splitLineSeparated(config.publicGuidelines.join('\n')),
        paidGuidelines: splitLineSeparated(config.paidGuidelines.join('\n')),
        fanvueCreatorName: config.fanvueCreatorName,
        fanvueBaseUrl: config.fanvueBaseUrl,
      })

      const saved = await studioFetch('/studio/v1/operator-config', studioOperatorConfigSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setConfig(saved)
      setError('')
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save operator defaults')
    }
    finally {
      setSavingConfig(false)
    }
  }

  async function saveCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSavingCharacter(true)
    try {
      const payload = createStudioCharacterRequestSchema.parse({
        code: characterForm.code,
        displayName: characterForm.displayName,
        personaSummary: characterForm.personaSummary,
        nationality: characterForm.nationality,
        profession: characterForm.profession,
        styleNotes: splitCommaSeparated(characterForm.styleNotes),
        defaultTier: characterForm.defaultTier,
        faceReferenceAssetIds: splitCommaSeparated(characterForm.faceReferenceAssetIds),
        status: characterForm.status,
      })

      await studioFetch('/studio/v1/characters', studioCharacterProfileSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setCharacterForm(initialCharacterForm)
      setError('')
      await loadData()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save character')
    }
    finally {
      setSavingCharacter(false)
    }
  }

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setSavingTemplate(true)
    try {
      const payload = createStudioTemplateRequestSchema.parse({
        code: templateForm.code,
        scene: templateForm.scene,
        intent: templateForm.intent,
        outfitTags: splitCommaSeparated(templateForm.outfitTags),
        fetishTags: splitCommaSeparated(templateForm.fetishTags),
        tierSuitability: templateForm.tierSuitability,
        positiveBlocks: splitLineSeparated(templateForm.positiveBlocks),
        negativeBlocks: splitLineSeparated(templateForm.negativeBlocks),
        status: templateForm.status,
      })

      await studioFetch('/studio/v1/templates', studioPromptTemplateSchema, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.token, apiBase)

      setTemplateForm(initialTemplateForm)
      setError('')
      await loadData()
    }
    catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save template')
    }
    finally {
      setSavingTemplate(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [session, apiBase])

  return (
    <FactoryShell
      title="Setup"
      subtitle="Keep the character bible, prompt blocks, and public-safe defaults tight before you spend time in ops."
    >
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading || !config
        ? <LoadingSpinner label="Loading setup workspace..." />
        : (
            <>
              <section style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Channel and policy defaults</h3>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
                      These defaults seed public-safe CTAs, review checklists, and paid export language across the room.
                    </p>
                  </div>
                  <div style={softCardStyle}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Loop</div>
                    <strong>X public {'->'} Fanvue paid</strong>
                  </div>
                </div>

                <form onSubmit={saveConfig} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Default CTA label</span>
                      <input
                        value={config.defaultCtaLabel}
                        onChange={event => setConfig(current => current ? { ...current, defaultCtaLabel: event.target.value } : current)}
                        style={fieldStyle}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Default CTA URL</span>
                      <input
                        value={config.defaultCtaUrl}
                        onChange={event => setConfig(current => current ? { ...current, defaultCtaUrl: event.target.value } : current)}
                        style={fieldStyle}
                      />
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Default public hashtags</span>
                    <input
                      value={config.defaultPublicHashtags.join(', ')}
                      onChange={event => setConfig(current => current ? { ...current, defaultPublicHashtags: splitCommaSeparated(event.target.value) } : current)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Default public checklist</span>
                    <textarea
                      value={config.defaultPublicChecklist.join('\n')}
                      onChange={event => setConfig(current => current ? { ...current, defaultPublicChecklist: splitLineSeparated(event.target.value) } : current)}
                      rows={4}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Default paid checklist</span>
                    <textarea
                      value={config.defaultPaidChecklist.join('\n')}
                      onChange={event => setConfig(current => current ? { ...current, defaultPaidChecklist: splitLineSeparated(event.target.value) } : current)}
                      rows={4}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Public-safe guidelines</span>
                    <textarea
                      value={config.publicGuidelines.join('\n')}
                      onChange={event => setConfig(current => current ? { ...current, publicGuidelines: splitLineSeparated(event.target.value) } : current)}
                      rows={5}
                      style={fieldStyle}
                      placeholder={'one line per rule\nsafe teaser only\nkeep routing in the CTA'}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Paid-side guidelines</span>
                    <textarea
                      value={config.paidGuidelines.join('\n')}
                      onChange={event => setConfig(current => current ? { ...current, paidGuidelines: splitLineSeparated(event.target.value) } : current)}
                      rows={5}
                      style={fieldStyle}
                      placeholder={'one line per rule\nreserve stronger material for paid only\nkeep delivery notes explicit'}
                    />
                  </label>

                  <button type="submit" style={primaryButtonStyle} disabled={savingConfig}>
                    {savingConfig ? 'Saving defaults...' : 'Save defaults'}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Character bible</h3>
                <form onSubmit={saveCharacter} style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Character code</span>
                      <input value={characterForm.code} onChange={event => setCharacterForm(current => ({ ...current, code: event.target.value }))} style={fieldStyle} required />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Character display name</span>
                      <input value={characterForm.displayName} onChange={event => setCharacterForm(current => ({ ...current, displayName: event.target.value }))} style={fieldStyle} required />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Nationality</span>
                      <input value={characterForm.nationality} onChange={event => setCharacterForm(current => ({ ...current, nationality: event.target.value }))} style={fieldStyle} required />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Profession</span>
                      <input value={characterForm.profession} onChange={event => setCharacterForm(current => ({ ...current, profession: event.target.value }))} style={fieldStyle} required />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Default tier</span>
                      <select value={characterForm.defaultTier} onChange={event => setCharacterForm(current => ({ ...current, defaultTier: event.target.value as typeof current.defaultTier }))} style={fieldStyle}>
                        {studioTierOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Status</span>
                      <select value={characterForm.status} onChange={event => setCharacterForm(current => ({ ...current, status: event.target.value as typeof current.status }))} style={fieldStyle}>
                        {studioEntityStatusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Persona summary</span>
                    <textarea value={characterForm.personaSummary} onChange={event => setCharacterForm(current => ({ ...current, personaSummary: event.target.value }))} rows={4} style={fieldStyle} required />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Style notes</span>
                    <input value={characterForm.styleNotes} onChange={event => setCharacterForm(current => ({ ...current, styleNotes: event.target.value }))} style={fieldStyle} />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Face reference asset IDs</span>
                    <input value={characterForm.faceReferenceAssetIds} onChange={event => setCharacterForm(current => ({ ...current, faceReferenceAssetIds: event.target.value }))} style={fieldStyle} />
                  </label>

                  <button type="submit" style={primaryButtonStyle} disabled={savingCharacter}>
                    {savingCharacter ? 'Saving character...' : 'Save character'}
                  </button>
                </form>

                <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                  {characters.map(character => (
                    <article key={character.id} style={softCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--brand)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{character.code}</div>
                          <strong>{character.displayName}</strong>
                          <div style={{ color: 'var(--muted)', marginTop: 4 }}>{character.nationality} - {character.profession}</div>
                        </div>
                        <div style={{ color: 'var(--muted)', textAlign: 'right' }}>
                          <div>{character.defaultTier}</div>
                          <div style={{ marginTop: 4 }}>Updated {formatDateTime(character.updatedAt)}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{character.personaSummary}</div>
                    </article>
                  ))}
                  {characters.length === 0 && <div style={softCardStyle}>No character profiles yet.</div>}
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Prompt templates</h3>
                <form onSubmit={saveTemplate} style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Template code</span>
                      <input value={templateForm.code} onChange={event => setTemplateForm(current => ({ ...current, code: event.target.value }))} style={fieldStyle} required />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Template scene</span>
                      <input value={templateForm.scene} onChange={event => setTemplateForm(current => ({ ...current, scene: event.target.value }))} style={fieldStyle} required />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Intent</span>
                      <input value={templateForm.intent} onChange={event => setTemplateForm(current => ({ ...current, intent: event.target.value }))} style={fieldStyle} required />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Status</span>
                      <select value={templateForm.status} onChange={event => setTemplateForm(current => ({ ...current, status: event.target.value as typeof current.status }))} style={fieldStyle}>
                        {studioEntityStatusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Outfit tags</span>
                    <input value={templateForm.outfitTags} onChange={event => setTemplateForm(current => ({ ...current, outfitTags: event.target.value }))} style={fieldStyle} />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Fetish tags</span>
                    <input value={templateForm.fetishTags} onChange={event => setTemplateForm(current => ({ ...current, fetishTags: event.target.value }))} style={fieldStyle} />
                  </label>

                  <div style={{ display: 'grid', gap: 8 }}>
                    <span>Tier suitability</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {studioTierOptions.map(option => {
                        const checked = templateForm.tierSuitability.includes(option.value)
                        return (
                          <label key={option.value} style={{ ...softCardStyle, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                setTemplateForm((current) => {
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
                    <textarea value={templateForm.positiveBlocks} onChange={event => setTemplateForm(current => ({ ...current, positiveBlocks: event.target.value }))} rows={6} style={fieldStyle} required />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span>Negative blocks</span>
                    <textarea value={templateForm.negativeBlocks} onChange={event => setTemplateForm(current => ({ ...current, negativeBlocks: event.target.value }))} rows={5} style={fieldStyle} />
                  </label>

                  <button type="submit" style={primaryButtonStyle} disabled={savingTemplate}>
                    {savingTemplate ? 'Saving template...' : 'Save template'}
                  </button>
                </form>

                <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                  {templates.map(template => (
                    <article key={template.id} style={softCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--brand)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{template.code}</div>
                          <strong>{template.scene}</strong>
                          <div style={{ color: 'var(--muted)', marginTop: 4 }}>{template.intent}</div>
                        </div>
                        <div style={{ color: 'var(--muted)', textAlign: 'right' }}>
                          <div>{template.tierSuitability.join(', ')}</div>
                          <div style={{ marginTop: 4 }}>Updated {formatDateTime(template.updatedAt)}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{template.positiveBlocks.join('\n')}</div>
                    </article>
                  ))}
                  {templates.length === 0 && <div style={softCardStyle}>No prompt templates yet.</div>}
                </div>
              </section>
            </>
          )}
    </FactoryShell>
  )
}
