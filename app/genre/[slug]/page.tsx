// app/genre/[slug]/page.tsx
// Genre discovery page with infinite scroll and sort/filter controls.

import type { Metadata } from 'next'
import GenrePage from '@/components/GenrePage'

// TMDB genre ID map
const GENRE_MAP: Record<string, { id: number; name: string }> = {
  'action':            { id: 28,  name: 'Action' },
  'adventure':         { id: 12,  name: 'Adventure' },
  'animation':         { id: 16,  name: 'Animation' },
  'comedy':            { id: 35,  name: 'Comedy' },
  'crime':             { id: 80,  name: 'Crime' },
  'documentary':       { id: 99,  name: 'Documentary' },
  'drama':             { id: 18,  name: 'Drama' },
  'family':            { id: 10751, name: 'Family' },
  'fantasy':           { id: 14,  name: 'Fantasy' },
  'history':           { id: 36,  name: 'History' },
  'horror':            { id: 27,  name: 'Horror' },
  'music':             { id: 10402, name: 'Music' },
  'mystery':           { id: 9648, name: 'Mystery' },
  'romance':           { id: 10749, name: 'Romance' },
  'science-fiction':   { id: 878, name: 'Science Fiction' },
  'sci-fi':            { id: 878, name: 'Science Fiction' },
  'thriller':          { id: 53,  name: 'Thriller' },
  'war':               { id: 10752, name: 'War' },
  'western':           { id: 37,  name: 'Western' },
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const genre = GENRE_MAP[slug]
  const name = genre?.name ?? slug.replace(/-/g, ' ')
  return {
    title: `${name} Movies`,
    description: `Browse the best ${name} movies, sorted by popularity and rating.`,
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const genre = GENRE_MAP[slug]
  const genreId = genre?.id ?? null
  const genreName = genre?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return <GenrePage genreId={genreId} genreName={genreName} slug={slug} />
}
