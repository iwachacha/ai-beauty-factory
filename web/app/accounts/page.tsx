'use client'

import { useEffect, useState } from 'react'
import { cardStyle, FactoryShell, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'

interface AccountItem {
  id: string
  platform: string
  nickname: string
  handle?: string
  followers: number
  views: number
  likes: number
  works: number
}

const connectablePlatforms = ['x', 'instagram', 'threads', 'tiktok', 'youtube']

export default function AccountsPage() {
  const { apiBase, session } = useFactory()
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [error, setError] = useState('')

  async function loadAccounts() {
    if (!session) {
      return
    }
    try {
      const data = await factoryFetch<AccountItem[]>('/accounts', {}, session.token, apiBase)
      setAccounts(data)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load accounts')
    }
  }

  async function connect(platform: string) {
    if (!session) {
      return
    }
    try {
      const result = await factoryFetch<{ url: string }>('/accounts/connect/' + platform, {
        method: 'POST',
        body: JSON.stringify({}),
      }, session.token, apiBase)
      if (!result.url) {
        throw new Error(`No authorization URL returned for ${platform}`)
      }
      setError('')
      window.open(result.url, '_blank', 'popup,width=640,height=760')
    }
    catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : `Failed to connect ${platform}`)
    }
  }

  useEffect(() => {
    void loadAccounts()
  }, [session])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === 'factory-connect-result') {
        void loadAccounts()
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [session])

  return (
    <FactoryShell title="Accounts" subtitle="Connect and monitor the channels your factory can post to.">
      <section style={cardStyle}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {connectablePlatforms.map(platform => (
            <button key={platform} onClick={() => void connect(platform)} style={primaryButtonStyle}>
              Connect {platform}
            </button>
          ))}
        </div>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      <section style={{ display: 'grid', gap: 16 }}>
        {accounts.map(account => (
          <article key={account.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)' }}>{account.platform}</div>
                <h3 style={{ margin: '8px 0 4px', fontFamily: 'var(--font-display), sans-serif' }}>{account.nickname}</h3>
                <div style={{ color: 'var(--muted)' }}>{account.handle || 'No handle'}</div>
              </div>
              <div style={{ ...softCardStyle, minWidth: 120 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Followers</div>
                <strong style={{ fontSize: 24 }}>{account.followers}</strong>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', marginTop: 16 }}>
              <div style={softCardStyle}><div style={{ color: 'var(--muted)', fontSize: 12 }}>Views</div><strong>{account.views}</strong></div>
              <div style={softCardStyle}><div style={{ color: 'var(--muted)', fontSize: 12 }}>Likes</div><strong>{account.likes}</strong></div>
              <div style={softCardStyle}><div style={{ color: 'var(--muted)', fontSize: 12 }}>Posts</div><strong>{account.works}</strong></div>
            </div>
          </article>
        ))}
        {accounts.length === 0 && <section style={cardStyle}>No accounts connected yet.</section>}
      </section>
    </FactoryShell>
  )
}
