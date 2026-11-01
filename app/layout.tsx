import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kalkulator obligacji',
  description: 'Kalkulator zwrotu z polskich obligacji skarbowych',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'Kalkulator obligacji',
    description: 'Kalkulator zwrotu z polskich obligacji skarbowych',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Kalkulator obligacji',
    description: 'Kalkulator zwrotu z polskich obligacji skarbowych',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && <Analytics />}
      </body>
    </html>
  )
}
