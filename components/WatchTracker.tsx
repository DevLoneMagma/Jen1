'use client'
// components/WatchTracker.tsx
// Listens for play events and records them into ContinueWatching storage.
// Invisible component — no UI.
import { useEffect } from 'react'
import { useContinueWatching } from '@/hooks/useContinueWatching'

export default function WatchTracker() {
  const { addEntry, updateProgress } = useContinueWatching()

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
    // Fired periodically by VideoPlayer while a stream is open — soft
    // wall-clock signal only, see WatchEntry.elapsedSeconds for why.
    const onProgress = (e: Event) => {
      const ev = e as CustomEvent<{ id: number; type: 'movie' | 'tv'; elapsedSeconds: number }>
      updateProgress(ev.detail.id, ev.detail.type, ev.detail.elapsedSeconds)
    }
    window.addEventListener('track-watch', onPlay)
    window.addEventListener('track-progress', onProgress)
    return () => {
      window.removeEventListener('track-watch', onPlay)
      window.removeEventListener('track-progress', onProgress)
    }
  }, [addEntry, updateProgress])

  return null
}
