// hooks/useSearchHistory.ts
// Tracks recent search queries the user has actually committed to (pressed
// Enter, clicked a result, or navigated to /search) — not every keystroke.
// Persists to localStorage. Pure client state, no auth, no backend.

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'jen1:search-history'
const MAX_ENTRIES = 8

function readStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStorage(entries: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {}
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() =>
    typeof window !== 'undefined' ? readStorage() : []
  )

  const addQuery = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setHistory(prev => {
      // Case-insensitive de-dup, most recent first
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase())
      const next = [trimmed, ...filtered].slice(0, MAX_ENTRIES)
      writeStorage(next)
      return next
    })
  }, [])

  const removeQuery = useCallback((query: string) => {
    setHistory(prev => {
      const next = prev.filter(q => q !== query)
      writeStorage(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    writeStorage([])
  }, [])

  return { history, addQuery, removeQuery, clearHistory }
}
