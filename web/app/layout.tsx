import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { FactoryProvider } from '../components/factory-provider'

export const metadata: Metadata = {
  title: 'SNS Factory',
  description: 'Mobile-first personal SNS posting factory',
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
