import './globals.css'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = 'https://www.cadent.online'
const SITE_NAME = 'Cadent'
const SITE_DESCRIPTION = 'Every practice counts. Track your music practice time, build daily streaks, and share your progress with your teacher — no app download required.'
const OG_IMAGE = `${SITE_URL}/cadent-logo.png`

export const metadata: Metadata = {
  title: {
    default: 'Cadent — Music Practice Tracker',
    template: '%s — Cadent',
  },
  description: SITE_DESCRIPTION,
  manifest: '/manifest.json',
  keywords: ['music practice tracker', 'practice timer', 'music student app', 'practice log', 'music teacher', 'practice streak', 'instrument practice'],
  authors: [{ name: 'Cadent' }],
  creator: 'Cadent',
  publisher: 'Cadent',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Cadent — Music Practice Tracker',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1024,
        height: 1024,
        alt: 'Cadent — Music Practice Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cadent — Music Practice Tracker',
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cadent',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F1115',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // JSON-LD structured data for WebApplication
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Cadent',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    applicationCategory: 'MusicApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Practice timer',
      'Practice streak tracking',
      'Song organization',
      'Teacher sharing via magic link',
      'Progress analytics',
      'Built-in metronome',
    ],
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    screenshot: `${SITE_URL}/cadent-logo.png`,
  }

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.className} antialiased bg-[#0F1115] text-[#F5F7FA]`}>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }`}
        </Script>
        <Script id="json-ld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(jsonLd)}
        </Script>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}