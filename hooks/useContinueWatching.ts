// hooks/useContinueWatching.ts
// Tracks what the user last played. Persists to localStorage.
// No auth, no backend. Pure client state.

import { useState, useEffect, useCallback } from 'react'

export interface WatchEntry {
  id: number
  type: 'movie' | 'tv'
  title: string
  posterPath: string | null
  backdropPath: string | null
  season?: number
  episode?: number
  rating: number
  addedAt: number
  // Soft elapsed-watch-time signal in seconds. Since streams play inside
  // third-party embed iframes (cross-origin), we have no way to read the
  // provider's actual playback position or seek to it — there's no
  // postMessage contract with vidsrc/vidlink/etc. This is instead wall-clock
  // time the player was open, used only to show "you were ~12m in" and to
  // rank/fade entries, not to resume to an exact timestamp.
  elapsedSeconds?: number
}

// What callers actually have on hand when a play event fires:
// everything WatchEntry needs except the id-collision-resolution
// timestamp, which this hook owns.
export type WatchEntryInput = Omit<WatchEntry, 'addedAt'>

const STORAGE_KEY = 'jen1:continue-watching'
const MAX_ENTRIES = 12

function readStorage(): WatchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStorage(entries: WatchEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {}
}

export function useContinueWatching() {
  const [entries, setEntries] = useState<WatchEntry[]>([])

  useEffect(() => {
    setEntries(readStorage())
  }, [])

  const addEntry = useCallback((input: WatchEntryInput) => {
    const entry: WatchEntry = { ...input, addedAt: Date.now() }
    setEntries(prev => {
      // Remove existing entry for this id and push to front
      const filtered = prev.filter(e => !(e.id === entry.id && e.type === entry.type))
      const next = [entry, ...filtered].slice(0, MAX_ENTRIES)
      writeStorage(next)
      return next
    })
  }, [])

  const removeEntry = useCallback((id: number, type: 'movie' | 'tv') => {
    setEntries(prev => {
      const next = prev.filter(e => !(e.id === id && e.type === type))
      writeStorage(next)
      return next
    })
  }, [])

  // Bumps the soft elapsed-time signal for an entry already in the list.
  // Called periodically by the player while open. No-ops if the entry
  // isn't present (e.g. it was removed mid-session).
  const updateProgress = useCallback((id: number, type: 'movie' | 'tv', elapsedSeconds: number) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === id && e.type === type)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], elapsedSeconds }
      writeStorage(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setEntries([])
    writeStorage([])
  }, [])

  return { entries, addEntry, removeEntry, updateProgress, clearAll }
}
