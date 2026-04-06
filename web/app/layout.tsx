import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { FactoryProvider } from '../components/factory-provider'

export const metadata: Metadata = {
  title: 'AI Beauty Studio',
  description: 'Single-account studio for generation, review, publishing, and insights.',
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
