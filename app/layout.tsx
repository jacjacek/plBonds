import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const Roboto = localFont({
  src: [
    { path: './fonts/Roboto-400.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Roboto-500.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Roboto-700.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-roboto',
  display: 'swap',
})
const Poppins = localFont({
  src: [
    { path: './fonts/Poppins-400.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Poppins-600.ttf', weight: '600', style: 'normal' },
  ],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'plBonds — kalkulator obligacji skarbowych',
  description: 'Kalkulator zwrotu z polskich obligacji skarbowych',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'plBonds — kalkulator obligacji skarbowych',
    description: 'Kalkulator zwrotu z polskich obligacji skarbowych',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'plBonds — kalkulator obligacji skarbowych',
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
      <body className={`font-sans ${Roboto.variable} ${Poppins.variable}`}>
        {children}
        {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && <Analytics />}
      </body>
    </html>
  )
}
