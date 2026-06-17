'use client'
// components/KeyboardHelp.tsx
// Hidden panel — press ? to reveal. No UI surfaces this except itself.
import { useState } from 'react'
import { X } from 'lucide-react'
import { useKeyboard } from '@/hooks/useKeyboard'

const SHORTCUTS = [
  { group: 'Navigation', items: [
    { keys: ['S', '/'], desc: 'Focus search' },
    { keys: ['Esc'], desc: 'Close / exit' },
    { keys: ['?'], desc: 'This panel' },
  ]},
  { group: 'Hero', items: [
    { keys: ['←', '→'], desc: 'Browse slides' },
    { keys: ['Space'], desc: 'Pause rotation' },
    { keys: ['T'], desc: 'Play trailer' },
    { keys: ['Enter'], desc: 'Open details' },
  ]},
  { group: 'Details', items: [
    { keys: ['P'], desc: 'Play' },
    { keys: ['T'], desc: 'Trailer' },
  ]},
  { group: 'Player', items: [
    { keys: ['F'], desc: 'Fullscreen' },
    { keys: ['N'], desc: 'Next source' },
  ]},
]

export default function KeyboardHelp() {
  const [open, setOpen] = useState(false)
  useKeyboard({ '?': e => { e.preventDefault(); setOpen(v => !v) }, 'Escape': () => open && setOpen(false) })

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="bg-[#131313] border border-white/08 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/06">
          <div className="font-archivo font-extrabold text-display-md">Keyboard Shortcuts</div>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto">
          {SHORTCUTS.map(group => (
            <div key={group.group}>
              <div className="text-jen1-red text-[10px] font-semibold uppercase tracking-widest mb-3">{group.group}</div>
              <div className="space-y-2.5">
                {group.items.map(item => (
                  <div key={item.desc} className="flex items-center justify-between gap-3">
                    <span className="text-white/50 text-xs">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map(k => (
                        <kbd key={k} className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 bg-white/06 border border-white/12 rounded text-[10px] font-mono text-white/60">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
