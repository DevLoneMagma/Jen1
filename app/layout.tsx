// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter, Archivo } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import StructuredData from '@/components/StructuredData'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Archivo is a variable font with a real width axis (62–125) — used here at
// an expanded width for display type (logo, hero, row headers). Replaces
// Bebas Neue: Bebas is condensed/all-caps-only with a single weight, which
// can't carry a hero title or logo wordmark with any real presence. Archivo
// gives a full weight range (100–900) at an expanded width, so the whole
// display type system — from a row label up to the hero — comes from one
// family instead of stitching faces together.
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
  weight: ['600', '700', '800', '900'],
})

const SITE_URL = 'https://jen1.vercel.app'
const SITE_NAME = 'Jen1'
const DESCRIPTION = 'Discover and stream movies and series — a cinematic experience built for the discerning viewer.'

export const viewport: Viewport = {
  themeColor: '#E50914',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} (Trust Me Bro)`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    'movies', 'streaming', 'watch online', 'series', 'films',
    'cinema', 'trailers', 'Jen1', 'movie discovery', 'free streaming',
  ],
  authors: [{ name: 'Jen1' }],
  creator: 'Jen1',
  publisher: 'Jen1',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/jen1-icon-512.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} (Trust Me Bro)`,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jen1 (Trust Me Bro)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} (Trust Me Bro)`,
    description: DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@jen1app',
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body className="bg-jen1-black text-white font-inter antialiased">
        <Providers>{children}</Providers>
        <StructuredData />
      </body>
    </html>
  )
}
