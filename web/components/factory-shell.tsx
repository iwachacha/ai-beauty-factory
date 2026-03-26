'use client'

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { factoryFetch } from '../lib/factory-api'
import { useFactory } from './factory-provider'

const navItems = [
  { href: '/accounts', label: 'Accounts' },
  { href: '/library', label: 'Library' },
  { href: '/flows', label: 'Flows' },
  { href: '/queue', label: 'Queue' },
  { href: '/settings', label: 'Settings' },
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
              Personal Factory
            </div>
            <h1 style={{ margin: '8px 0 0', fontFamily: 'var(--font-display), sans-serif', fontSize: 28 }}>
              SNS Ops
            </h1>
          </div>
          <nav style={{ display: 'grid', gap: 8 }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '12px 14px',
                  borderRadius: 16,
                  color: pathname === item.href ? 'white' : 'var(--text)',
                  background: pathname === item.href ? 'linear-gradient(135deg, var(--brand), var(--brand-soft))' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)', color: 'var(--muted)', fontSize: 14 }}>
            {session ? `Signed in as ${session.user.name}` : 'Sign in to start posting'}
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
                <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)' }}>Dashboard</div>
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
                  Sign out
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
                  <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display), sans-serif' }}>Admin login</h3>
                  <form onSubmit={handleLogin} style={{ display: 'grid', gap: 14, maxWidth: 420 }}>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Email</span>
                      <input value={email} onChange={event => setEmail(event.target.value)} style={fieldStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span>Password</span>
                      <input type="password" value={password} onChange={event => setPassword(event.target.value)} style={fieldStyle} />
                    </label>
                    {error && <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>}
                    <button type="submit" style={primaryButtonStyle}>Sign in</button>
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

const fieldStyle: CSSProperties = {
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
