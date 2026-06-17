'use client'
// components/ContinueWatching.tsx
import { Play, X } from 'lucide-react'
import Image from 'next/image'
import { useContinueWatching, type WatchEntry } from '@/hooks/useContinueWatching'
import { posterUrl } from '@/lib/tmdb'

export default function ContinueWatching() {
  const { entries, removeEntry } = useContinueWatching()

  if (entries.length === 0) return null

  const openItem = (entry: WatchEntry) => {
    window.dispatchEvent(new CustomEvent('open-movie', {
      detail: { id: entry.id, type: entry.type }
    }))
  }

  const resume = (entry: WatchEntry, e: React.MouseEvent) => {
    e.stopPropagation()
    // Dispatch play event directly with saved episode info
    window.dispatchEvent(new CustomEvent('resume-watching', { detail: entry }))
  }

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="w-0.5 h-5 bg-jen1-red rounded-full flex-shrink-0" />
        <h2 className="font-archivo font-extrabold text-display-md text-white">Continue Watching</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 row-scroll">
        {entries.map(entry => (
          <div
            key={`${entry.type}-${entry.id}`}
            className="group relative flex-shrink-0 w-[148px] cursor-pointer"
            onClick={() => openItem(entry)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && openItem(entry)}
          >
            {/* Poster */}
            <div
              className="relative w-full h-[222px] rounded-xl overflow-hidden transition-all duration-200 group-hover:-translate-y-1.5 jen1-card-shadow"
            >
              <Image
                src={posterUrl(entry.posterPath)}
                alt={entry.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                sizes="148px"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* Resume button */}
                <button
                  onClick={e => resume(entry, e)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-jen1-red rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-200 shadow-lg hover:bg-red-500"
                  aria-label="Resume"
                >
                  <Play size={15} fill="white" className="ml-0.5" />
                </button>
                <div className="absolute bottom-0 inset-x-0 p-3">
                  <div className="text-white text-[11px] font-semibold leading-tight truncate">{entry.title}</div>
                  {entry.type === 'tv' && entry.season && (
                    <div className="text-white/45 text-[10px] mt-0.5">S{entry.season} · E{entry.episode}</div>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={e => { e.stopPropagation(); removeEntry(entry.id, entry.type) }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 border border-white/15 text-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-white hover:bg-black"
                aria-label="Remove"
              >
                <X size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
