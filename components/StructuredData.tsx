// components/StructuredData.tsx
// Injects JSON-LD schema.org markup for SEO.
// Renders server-side — no 'use client'.

const SITE_URL = 'https://jen1.vercel.app'

export default function StructuredData() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Jen1',
    url: SITE_URL,
    description: 'Discover and stream movies and series — a cinematic experience built for the discerning viewer.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Jen1',
    url: SITE_URL,
    logo: `${SITE_URL}/jen1-icon-512.png`,
    sameAs: [],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
    </>
  )
}
