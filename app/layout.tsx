import type { Metadata, Viewport } from 'next'
import { Nunito, Nunito_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CalmModeProvider } from '@/lib/context/calm-mode-context'
import { ThemeProvider } from '@/lib/context/theme-context'
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
  description: 'Diário emocional inteligente com análise de sentimentos por IA para indivíduos autistas. Monitorize padrões de humor, identifique gatilhos sensoriais e previna crises.',
  keywords: ['autismo', 'diário emocional', 'análise de sentimentos', 'NLP', 'bem-estar', 'saúde mental'],
  authors: [{ name: 'sentimentAU' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
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
    { media: '(prefers-color-scheme: dark)', color: '#151b2d' },
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <CalmModeProvider>
            {children}
          </CalmModeProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
