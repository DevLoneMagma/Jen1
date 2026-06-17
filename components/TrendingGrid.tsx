'use client'
// components/TrendingGrid.tsx
import { useCallback } from 'react'
import type { Movie, TVShow } from '@/types/tmdb'
import MediaGrid from './MediaGrid'

type MediaItem = (Movie & { _type: 'movie' }) | (TVShow & { _type: 'tv' })

export default function TrendingGrid() {
  const fetchPage = useCallback(async (page: number): Promise<MediaItem[]> => {
    const [moviesRes, tvRes] = await Promise.all([
      fetch(`/api/tmdb?path=/trending/movie/week&page=${page}`).then(r => r.json()),
      fetch(`/api/tmdb?path=/trending/tv/week&page=${page}`).then(r => r.json()),
    ])
    const movies: MediaItem[] = (moviesRes.results ?? [])
      .filter((m: Movie) => m.poster_path)
      .map((m: Movie) => ({ ...m, _type: 'movie' as const }))
    const shows: MediaItem[] = (tvRes.results ?? [])
      .filter((s: TVShow) => s.poster_path)
      .map((s: TVShow) => ({ ...s, _type: 'tv' as const }))
    // Interleave rather than concatenate so movies don't dominate the
    // first several rows just because they're listed first in the array.
    const merged: MediaItem[] = []
    const max = Math.max(movies.length, shows.length)
    for (let i = 0; i < max; i++) {
      if (movies[i]) merged.push(movies[i])
      if (shows[i]) merged.push(shows[i])
    }
    return merged
  }, [])

  return <MediaGrid fetchPage={fetchPage} pageSize={20} emptyMessage="Nothing trending right now" />
}
