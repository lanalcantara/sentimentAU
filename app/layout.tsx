import type { Metadata, Viewport } from 'next'
import { Nunito, Nunito_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CalmModeProvider } from '@/lib/context/calm-mode-context'

import './globals.css'

const nunito = Nunito({ 
  subsets: ["latin"],
  variable: '--font-nunito',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({ 
  subsets: ["latin"],
  variable: '--font-nunito-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'sentimentAU - Diário Emocional Inteligente',
  description: 'Diário emocional inteligente com análise de sentimentos por IA para indivíduos autistas.',
  keywords: ['autismo', 'diário emocional', 'análise de sentimentos', 'NLP', 'bem-estar', 'saúde mental'],
  authors: [{ name: 'sentimentAU' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfaf3' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt" className={`${nunito.variable} ${nunitoSans.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <CalmModeProvider>
          {children}
        </CalmModeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
