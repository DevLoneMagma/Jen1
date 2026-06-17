'use client'
// components/WatchTracker.tsx
// Listens for play events and records them into ContinueWatching storage.
// Invisible component — no UI.
import { useEffect } from 'react'
import { useContinueWatching } from '@/hooks/useContinueWatching'

export default function WatchTracker() {
  const { addEntry } = useContinueWatching()

  useEffect(() => {
    // Fired by DetailModal when user presses Play
    const onPlay = (e: Event) => {
      const ev = e as CustomEvent<{
        id: number
        type: 'movie' | 'tv'
        title: string
        posterPath: string | null
        backdropPath: string | null
        rating: number
        season?: number
        episode?: number
      }>
      const d = ev.detail
      addEntry({
        id: d.id,
        type: d.type,
        title: d.title,
        posterPath: d.posterPath,
        backdropPath: d.backdropPath,
        rating: d.rating,
        ...(d.type === 'tv' ? { season: d.season, episode: d.episode } : {}),
      })
    }
    window.addEventListener('track-watch', onPlay)
    return () => window.removeEventListener('track-watch', onPlay)
  }, [addEntry])

  return null
}
