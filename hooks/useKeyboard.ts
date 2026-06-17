// hooks/useKeyboard.ts
// Central keyboard shortcut registry for Jen1.
// Each component registers its own handlers via this hook — no global spaghetti.

import { useEffect, useRef } from 'react'

export type KeyHandler = (e: KeyboardEvent) => void

interface ShortcutOptions {
  // Only fire when no input/textarea is focused (default: true)
  ignoreInputs?: boolean
  // Only fire when condition is true
  enabled?: boolean
}

export function useKeyboard(
  shortcuts: Record<string, KeyHandler>,
  options: ShortcutOptions = {}
) {
  const { ignoreInputs = true, enabled = true } = options

  // Keep the latest shortcuts map in a ref so the event listener
  // never has to be torn down and re-attached just because the
  // caller passed a new object literal on this render.
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input unless explicitly allowed
      if (ignoreInputs) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if ((e.target as HTMLElement)?.isContentEditable) return
      }

      // Build key combo string: "ctrl+k", "shift+ArrowRight", "Escape", etc.
      const parts: string[] = []
      if (e.metaKey) parts.push('meta')
      if (e.ctrlKey) parts.push('ctrl')
      if (e.altKey) parts.push('alt')
      if (e.shiftKey) parts.push('shift')
      parts.push(e.key)
      const combo = parts.join('+')

      const fn = shortcutsRef.current[combo] ?? shortcutsRef.current[e.key]
      if (fn) {
        fn(e)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, ignoreInputs])
}
