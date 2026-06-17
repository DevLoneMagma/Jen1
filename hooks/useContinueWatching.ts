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

  const clearAll = useCallback(() => {
    setEntries([])
    writeStorage([])
  }, [])

  return { entries, addEntry, removeEntry, clearAll }
}
