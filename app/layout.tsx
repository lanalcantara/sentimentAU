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
  title: 'sentimentAU - Seu Espaço Seguro',
  description: 'Diário emocional inteligente com análise de sentimentos por IA para indivíduos autistas.',
  keywords: ['autismo', 'diário emocional', 'análise de sentimentos', 'NLP', 'bem-estar', 'saúde mental'],
  authors: [{ name: 'sentimentAU' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'sentimentAU',
  },
}

export const viewport: Viewport = {
  themeColor: '#A3B899',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
