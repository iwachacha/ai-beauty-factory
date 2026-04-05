import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { FactoryProvider } from '../components/factory-provider'

export const metadata: Metadata = {
  title: 'AI Beauty Factory',
  description: 'AI Beauty Monetization Management Dashboard',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <FactoryProvider>
          {children}
        </FactoryProvider>
      </body>
    </html>
  )
}
