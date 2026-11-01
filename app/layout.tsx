import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'plBonds — kalkulator obligacji skarbowych',
  description: 'Niezależny kalkulator obligacji skarbowych. Porównaj zysk po podatku i opłatach.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'plBonds — kalkulator obligacji skarbowych',
    description: 'Niezależny kalkulator obligacji skarbowych. Porównaj zysk po podatku i opłatach.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'plBonds — kalkulator obligacji skarbowych',
    description: 'Niezależny kalkulator obligacji skarbowych. Porównaj zysk po podatku i opłatach.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl">
      <body className={`font-sans ${GeistSans.variable}`}>
        {children}
        {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && <Analytics />}
      </body>
    </html>
  )
}
