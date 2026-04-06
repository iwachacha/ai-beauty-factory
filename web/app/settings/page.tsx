'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import z from 'zod'
import { cardStyle, FactoryShell, fieldStyle, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'
import { studioChannelAccountStateSchema } from '../../lib/studio-contracts'
import { studioFetch } from '../../lib/studio-api'
import { formatDateTime, formatNumber, statusChipStyle } from '../../lib/studio-ui'

const apiKeyListSchema = z.array(z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
}))

export default function SettingsPage() {
  const { apiBase, setApiBase, session } = useFactory()
  const [draftApiBase, setDraftApiBase] = useState(apiBase)
  const [apiKeys, setApiKeys] = useState<z.infer<typeof apiKeyListSchema>>([])
  const [channelState, setChannelState] = useState<z.infer<typeof studioChannelAccountStateSchema> | null>(null)
  const [name, setName] = useState('')
  const [lastCreatedKey, setLastCreatedKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const activeStudioAccount = useMemo(
    () => channelState?.items.find(item => item.isActive) || null,
    [channelState],
  )

  async function loadPageData() {
    if (!session) {
      return
    }

    setLoading(true)
    try {
      const [keyData, nextChannelState] = await Promise.all([
        studioFetch('/settings/api-keys', apiKeyListSchema, {}, session.token, apiBase),
        studioFetch('/studio/v1/channel-account', studioChannelAccountStateSchema, {}, session.token, apiBase),
      ])
      setApiKeys(keyData)
      setChannelState(nextChannelState)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load settings')
    }
    finally {
      setLoading(false)
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
      await loadPageData()
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
      await loadPageData()
    }
    catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete API key')
    }
  }

  async function connectX() {
    if (!session) {
      return
    }

    try {
      const result = await factoryFetch<{ url: string }>('/accounts/connect/x', {
        method: 'POST',
        body: JSON.stringify({}),
      }, session.token, apiBase)
      if (!result.url) {
        throw new Error('No authorization URL returned for X')
      }
      window.open(result.url, '_blank', 'popup,width=640,height=760')
      setError('')
    }
    catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Failed to start X connection')
    }
  }

  async function activateAccount(accountId: string) {
    if (!session) {
      return
    }

    try {
      const nextState = await studioFetch('/studio/v1/channel-account', studioChannelAccountStateSchema, {
        method: 'POST',
        body: JSON.stringify({ accountId }),
      }, session.token, apiBase)
      setChannelState(nextState)
      setError('')
    }
    catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : 'Failed to activate account')
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [session, apiBase])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === 'factory-connect-result') {
        void loadPageData()
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [session, apiBase])

  return (
    <FactoryShell
      title="Settings"
      subtitle="Keep one X account active, manage API access, and point the studio to the current backend."
    >
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>API endpoint</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input value={draftApiBase} onChange={event => setDraftApiBase(event.target.value)} style={{ ...fieldStyle, flex: 1 }} />
          <button onClick={() => setApiBase(draftApiBase)} style={primaryButtonStyle}>Save API base</button>
        </div>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'start' }}>
          <div>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Active X account</h3>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
              The studio always exports publish packages against a single active X account.
            </p>
          </div>
          <button onClick={() => void connectX()} style={primaryButtonStyle}>Connect or reconnect X</button>
        </div>

        {activeStudioAccount
          ? (
              <article style={{ ...softCardStyle, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{activeStudioAccount.credentialSummary.nickname}</strong>
                    <div style={{ color: 'var(--muted)', marginTop: 4 }}>{activeStudioAccount.credentialSummary.handle || 'No handle'}</div>
                    <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                      Last synced {formatDateTime(activeStudioAccount.credentialSummary.lastSyncedAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={statusChipStyle(activeStudioAccount.status === 'connected' ? 'success' : 'danger')}>
                      {activeStudioAccount.status}
                    </div>
                    <div style={{ marginTop: 12, color: 'var(--muted)' }}>
                      Followers {formatNumber(activeStudioAccount.credentialSummary.followers)}
                    </div>
                  </div>
                </div>
              </article>
            )
          : (
              <div style={{ ...softCardStyle, marginTop: 16 }}>
                No active X account yet. Connect one account and set it as active below.
              </div>
            )}

        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {(channelState?.availableAccounts || []).map(account => {
            const isActive = activeStudioAccount?.accountId === account.accountId
            return (
              <article key={account.accountId} style={softCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <strong>{account.nickname}</strong>
                    <div style={{ color: 'var(--muted)', marginTop: 4 }}>{account.handle || 'No handle'}</div>
                    <div style={{ color: 'var(--muted)', marginTop: 4 }}>Followers {formatNumber(account.followers)}</div>
                  </div>
                  <button
                    onClick={() => void activateAccount(account.accountId)}
                    style={{
                      ...primaryButtonStyle,
                      opacity: isActive ? 0.7 : 1,
                    }}
                    disabled={isActive}
                  >
                    {isActive ? 'Active account' : 'Make active'}
                  </button>
                </div>
              </article>
            )
          })}
          {!loading && (channelState?.availableAccounts.length || 0) === 0 && (
            <div style={softCardStyle}>
              No connected X accounts were found for this user yet.
            </div>
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>API keys</h3>
        <form onSubmit={createKey} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Key name"
            style={{ ...fieldStyle, flex: 1 }}
          />
          <button type="submit" style={primaryButtonStyle}>Create key</button>
        </form>
        {lastCreatedKey && (
          <div style={{ ...softCardStyle, marginBottom: 16 }}>
            Newly created key:
            {' '}
            <code>{lastCreatedKey}</code>
          </div>
        )}
        <div style={{ display: 'grid', gap: 12 }}>
          {apiKeys.map(apiKey => (
            <article key={apiKey.id} style={softCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <strong>{apiKey.name}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDateTime(apiKey.createdAt)}</div>
                </div>
                <button onClick={() => void deleteKey(apiKey.id)} style={primaryButtonStyle}>Delete</button>
              </div>
            </article>
          ))}
          {!loading && apiKeys.length === 0 && (
            <div style={softCardStyle}>No API keys yet.</div>
          )}
        </div>
      </section>
    </FactoryShell>
  )
}
