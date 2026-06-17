// app/sitemap.ts
import { MetadataRoute } from 'next'
import { getTrending, getTrendingTV } from '@/lib/tmdb'

const GENRES = [
  'action','adventure','animation','comedy','crime','documentary','drama',
  'family','fantasy','history','horror','mystery','romance','science-fiction',
  'thriller','war','western',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://jen1.vercel.app'

  // Detail pages are now indexable (Phase 2) — seed the sitemap with
  // current trending titles. This list is a starting point, not exhaustive;
  // search engines will also discover further titles by following the
  // "More Like This" and filmography links on each detail page.
  let movieEntries: MetadataRoute.Sitemap = []
  let tvEntries: MetadataRoute.Sitemap = []
  try {
    const [trendingMovies, trendingTV] = await Promise.all([getTrending(), getTrendingTV()])
    movieEntries = trendingMovies.map(m => ({
      url: `${base}/movie/${m.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
    tvEntries = trendingTV.map(s => ({
      url: `${base}/tv/${s.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch {
    // TMDB unavailable at build time — fall back to the static routes below
    // rather than failing the whole sitemap.
  }

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...GENRES.map(slug => ({
      url: `${base}/genre/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...movieEntries,
    ...tvEntries,
  ]
}
