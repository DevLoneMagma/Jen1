'use client'
// components/MovieCard.tsx
import { useRef } from 'react'
import Image from 'next/image'
import { Play, Star } from 'lucide-react'
import type { Movie, TVShow } from '@/types/tmdb'
import { posterUrl, getTitle, getReleaseYear } from '@/lib/tmdb'
import { prefetchModalData } from '@/lib/modalCache'

interface MovieCardProps {
  item: Movie | TVShow
  mediaType: 'movie' | 'tv'
  // 1-based position within a ranked row (e.g. Trending). When <= 10,
  // renders a "Top 10" stamp. Omit for unranked rows.
  rank?: number
}

const PREFETCH_DELAY_MS = 300
const NEW_WINDOW_DAYS = 30

function isRecentRelease(item: Movie | TVShow): boolean {
  const dateStr = 'release_date' in item ? item.release_date : item.first_air_date
  if (!dateStr) return false
  const days = (Date.now() - new Date(dateStr).getTime()) / 86_400_000
  return days >= 0 && days <= NEW_WINDOW_DAYS
}

function ratingColor(rating: number): string {
  if (rating >= 8) return 'text-emerald-400'
  if (rating >= 6) return 'text-amber-400'
  return 'text-white/45'
}

export default function MovieCard({ item, mediaType, rank }: MovieCardProps) {
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const openModal = () =>
    window.dispatchEvent(new CustomEvent('open-movie', { detail: { id: item.id, type: mediaType } }))

  const handleMouseEnter = () => {
    // Silently warm the modal-data cache so opening this card later feels
    // instant. The 300ms threshold avoids firing on quick mouse pass-throughs.
    hoverTimer.current = setTimeout(() => prefetchModalData(item.id, mediaType), PREFETCH_DELAY_MS)
  }

  const handleMouseLeave = () => clearTimeout(hoverTimer.current)

  const isTop10 = typeof rank === 'number' && rank <= 10
  const isNew = isRecentRelease(item)
  const title = getTitle(item)

  return (
    <div
      className="jen1-card group relative flex-shrink-0 w-[148px] h-[222px] rounded-lg overflow-hidden cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={openModal}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && openModal()}
      aria-label={title}
    >
      {/* Border ring — separate layer from the card's own transform so it
          can fade in independently rather than relying on a hard box-shadow
          inset that competes visually with the drop shadow below. */}
      <div className="absolute inset-0 rounded-lg ring-1 ring-white/[0.06] group-hover:ring-jen1-red/40 transition-[box-shadow] duration-300 z-20 pointer-events-none" />

      <Image
        src={posterUrl(item.poster_path)}
        alt={title}
        fill
        className="jen1-card-image object-cover"
        sizes="148px"
        loading="lazy"
      />

      {/* Top 10 stamp — large stylized number, refined: Archivo at max
          weight/width rather than a stroked hack, with a soft vertical
          gradient mask so it reads as an intentional graphic element
          sitting on the poster rather than text glued on top of it. */}
      {isTop10 && (
        <div
          className="absolute -bottom-1.5 -left-1 z-10 select-none pointer-events-none opacity-95 group-hover:opacity-0 transition-opacity duration-200"
          aria-hidden="true"
        >
          <span
            className="font-archivo font-black text-[72px] leading-none tracking-tighter"
            style={{
              fontVariationSettings: "'wdth' 125",
              backgroundImage: 'linear-gradient(180deg, #FF3B3B 0%, #E50914 55%, #8B0000 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(255,255,255,0.18)',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
            }}
          >
            {rank}
          </span>
        </div>
      )}

      {/* New pill */}
      {isNew && (
        <div className="absolute top-2 right-2 z-10 bg-jen1-red text-white text-ui-2xs font-bold uppercase px-1.5 py-[3px] rounded-[4px] shadow-sm">
          New
        </div>
      )}

      {/* Hover layer — staged: the scrim and image-dim happen on the base
          200ms transition, while the text content is held back by a short
          delay so the reveal feels sequenced rather than everything
          snapping in at once. */}
      <div className="jen1-card-scrim absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white/95 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-200 ease-out shadow-lg">
          <Play size={13} fill="#0A0A0A" className="text-jen1-black ml-0.5" />
        </div>

        <div className="jen1-card-text absolute bottom-0 inset-x-0 p-2.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 delay-[60ms]">
          <div className="font-inter font-semibold text-ui-sm text-white leading-tight truncate">{title}</div>
          <div className="font-inter text-ui-xs text-white/50 mt-1 flex items-center gap-1">
            <span>{getReleaseYear(item)}</span>
            {item.vote_average ? (
              <>
                <span className="text-white/25">·</span>
                <span className={`flex items-center gap-0.5 font-medium ${ratingColor(item.vote_average)}`}>
                  <Star size={9} className="fill-current" />
                  {item.vote_average.toFixed(1)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
