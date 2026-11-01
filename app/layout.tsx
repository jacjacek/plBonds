import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Newsreader } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-newsreader',
})

export const metadata: Metadata = {
  title: 'Kalkulator obligacji',
  description: 'Kalkulator zwrotu z polskich obligacji skarbowych',
  generator: 'Vibecoded, do not trust it',
  icons: {
    icon: '/thumbnail.png',
    apple: '/thumbnail.png',
    shortcut: '/thumbnail.png',
  },
  openGraph: {
    title: 'Kalkulator obligacji',
    description: 'Kalkulator zwrotu z polskich obligacji skarbowych',
    type: 'website',
    images: ['/thumbnail.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kalkulator obligacji',
    description: 'Kalkulator zwrotu z polskich obligacji skarbowych',
    images: ['/thumbnail.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${newsreader.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
