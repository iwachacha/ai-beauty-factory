'use client'

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { factoryFetch } from '../lib/factory-api'
import { useFactory } from './factory-provider'

const navItems = [
  { href: '/characters', label: 'キャラクター', description: 'AIモデル管理' },
  { href: '/templates', label: 'テンプレート', description: 'プロンプトとシーン' },
  { href: '/monetization', label: '配信・収益', description: 'コンテンツ投稿状況' },
  { href: '/calendar', label: 'カレンダー', description: '投稿スケジュール' },
  { href: '/accounts', label: 'アカウント連携', description: 'SNSアカウントの登録' },
  { href: '/library', label: 'ライブラリー', description: '投稿素材の管理' },
  { href: '/flows', label: '配信フロー', description: '自動投稿のルール作成' },
  { href: '/queue', label: '実行状況', description: '配信タスクの監視' },
  { href: '/settings', label: 'システム設定', description: '環境とセキュリティ' },
]

export function FactoryShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const { apiBase, session, setSession } = useFactory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    try {
      const nextSession = await factoryFetch<{
        token: string
        user: { id: string, email: string, name: string }
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, undefined, apiBase)
      setSession(nextSession)
    }
    catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed')
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px 16px 88px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gap: 20, gridTemplateColumns: '280px minmax(0, 1fr)' }} className="factory-layout">
        <aside
          style={{
            position: 'sticky',
            top: 20,
            alignSelf: 'start',
            padding: 20,
            border: '1px solid var(--line)',
            borderRadius: 28,
            background: 'var(--card)',
            boxShadow: 'var(--shadow)',
          }}
          className="factory-sidebar"
        >
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)' }}>
              AI Beauty Studio
            </div>
            <h1 style={{ margin: '8px 0 0', fontFamily: 'var(--font-display), sans-serif', fontSize: 28 }}>
              Monetization
            </h1>
          </div>
          <nav style={{ display: 'grid', gap: 8 }}>
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '12px 14px',
                    borderRadius: 16,
                    color: isActive ? 'white' : 'var(--text)',
                    background: isActive ? 'linear-gradient(135deg, var(--brand), var(--brand-soft))' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: isActive ? 600 : 500, fontSize: 15 }}>{item.label}</div>
                  <div style={{ fontSize: 11, marginTop: 2, color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--muted)' }}>
                    {item.description}
                  </div>
                </Link>
              )
            })}
          </nav>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)', color: 'var(--muted)', fontSize: 13 }}>
            {session ? `ログイン中: ${session.user.name}` : '投稿を始めるにはログインしてください'}
          </div>
        </aside>

        <main style={{ display: 'grid', gap: 20 }}>
          <section
            style={{
              padding: 24,
              border: '1px solid var(--line)',
              borderRadius: 28,
              background: 'var(--card)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)' }}>ダッシュボード</div>
                <h2 style={{ margin: '8px 0 6px', fontFamily: 'var(--font-display), sans-serif', fontSize: 34 }}>{title}</h2>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{subtitle}</p>
              </div>
              {session && (
                <button
                  onClick={() => setSession(null)}
                  style={{
                    border: '1px solid var(--line)',
                    background: 'white',
                    color: 'var(--text)',
                    borderRadius: 999,
                    padding: '10px 14px',
                    cursor: 'pointer',
                  }}
                >
                  ログアウト
                </button>
              )}
            </div>
          </section>

          {!session
            ? (
                <section
                  style={{
                    padding: 24,
                    border: '1px solid var(--line)',
                    borderRadius: 28,
                    background: 'var(--card-strong)',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>管理者ログイン</h3>
                  <form onSubmit={handleLogin} style={{ display: 'grid', gap: 14, maxWidth: 420 }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>メールアドレス</span>
                      <input value={email} onChange={event => setEmail(event.target.value)} style={fieldStyle} required />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>パスワード</span>
                      <input type="password" value={password} onChange={event => setPassword(event.target.value)} style={fieldStyle} required />
                    </label>
                    {error && <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>}
                    <button type="submit" style={primaryButtonStyle}>サインイン</button>
                  </form>
                </section>
              )
            : children}
        </main>
      </div>

      <nav
        style={{
          position: 'fixed',
          left: 12,
          right: 12,
          bottom: 12,
          display: 'none',
          gap: 8,
          padding: 8,
          borderRadius: 24,
          background: 'rgba(255,250,242,0.92)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)',
          backdropFilter: 'blur(20px)',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none', // For Firefox
        }}
        className="factory-bottom-nav"
      >
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 8px',
              borderRadius: 16,
              fontSize: 13,
              background: pathname === item.href ? 'linear-gradient(135deg, var(--brand), var(--brand-soft))' : 'transparent',
              color: pathname === item.href ? 'white' : 'var(--text)',
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <style jsx global>{`
        @media (max-width: 860px) {
          .factory-layout {
            grid-template-columns: 1fr !important;
          }

          .factory-sidebar {
            display: none;
          }

          .factory-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}

export const fieldStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid var(--line)',
  background: 'white',
}

export const primaryButtonStyle: CSSProperties = {
  border: 'none',
  background: 'linear-gradient(135deg, var(--brand), var(--brand-soft))',
  color: 'white',
  borderRadius: 16,
  padding: '12px 16px',
  cursor: 'pointer',
  fontWeight: 700,
}

export const cardStyle: CSSProperties = {
  padding: 20,
  borderRadius: 24,
  background: 'var(--card)',
  border: '1px solid var(--line)',
  boxShadow: 'var(--shadow)',
}

export const softCardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.7)',
  border: '1px solid var(--line)',
}

export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <section style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, color: 'var(--muted)' }}>
      <span style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        border: '3px solid var(--line)',
        borderTopColor: 'var(--brand)',
        borderRadius: '50%',
        animation: 'factory-spin 0.7s linear infinite',
      }} />
      {label}
      <style jsx>{`
        @keyframes factory-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}

