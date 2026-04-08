import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { FactoryProvider } from '../components/factory-provider'

export const metadata: Metadata = {
  title: 'AI Beauty Control Room',
  description: 'Lean X to Fanvue control room for generation, review, export, and funnel learning.',
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
