'use client'
// components/MovieRow.tsx
import { useState } from 'react'
import Link from 'next/link'
import type { Movie, TVShow } from '@/types/tmdb'
import MovieCard from './MovieCard'

export interface RowFilterOption {
  label: string
  // Appended to the row's base fetch path as TMDB discover params,
  // e.g. { sort_by: 'vote_average.desc', 'vote_count.gte': '300' }
  params: Record<string, string>
}

interface MovieRowProps {
  title: string
  movies: (Movie | TVShow)[]
  accent?: boolean
  mediaType: 'movie' | 'tv'
  // Show Top 10 stamps on the first 10 cards — only meaningful for
  // genuinely ranked data (e.g. trending), so it's opt-in per row.
  ranked?: boolean
  // Ghost "Explore →" link shown on row-title hover, navigating to the
  // row's full listing page (a genre page, /trending, etc).
  exploreHref?: string
  // Inline filter chips ("Popular | Rated | New") that appear on row-title
  // hover and swap this row's data without leaving the page. Requires
  // discoverPath (the TMDB discover endpoint this row's data comes from)
  // since chips re-fetch via /api/tmdb rather than re-running server props.
  filters?: RowFilterOption[]
  discoverPath?: string
}

export default function MovieRow({
  title, movies: initialMovies, accent = false, mediaType, ranked = false,
  exploreHref, filters, discoverPath,
}: MovieRowProps) {
  const [movies, setMovies] = useState(initialMovies)
  const [activeFilter, setActiveFilter] = useState(0)
  const [filterLoading, setFilterLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  const applyFilter = async (idx: number) => {
    if (idx === activeFilter || !filters || !discoverPath || filterLoading) return
    setActiveFilter(idx)
    setFilterLoading(true)
    try {
      const params = new URLSearchParams({ path: discoverPath, ...filters[idx].params })
      const res = await fetch(`/api/tmdb?${params}`)
      const data = await res.json()
      const results = (data.results ?? []).filter((m: Movie | TVShow) => m.poster_path).slice(0, 15)
      setMovies(results)
    } catch {
      // Leave the row showing its previous data rather than clearing it
    } finally {
      setFilterLoading(false)
    }
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="flex items-center justify-between mb-3.5 min-h-[28px]">
        <div className="flex items-center gap-2.5">
          {accent && <div className="w-0.5 h-5 bg-jen1-red rounded-full flex-shrink-0" />}
          <h2 className="font-archivo font-extrabold text-display-md text-white">{title}</h2>
          {exploreHref && (
            <Link
              href={exploreHref}
              className={`text-white/40 hover:text-jen1-red text-xs font-medium transition-all ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Explore →
            </Link>
          )}
        </div>

        {filters && filters.length > 0 && (
          <div className={`flex gap-1.5 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {filters.map((f, i) => (
              <button
                key={f.label}
                onClick={() => applyFilter(i)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                  activeFilter === i
                    ? 'bg-jen1-red/15 border-jen1-red/40 text-jen1-red'
                    : 'bg-white/04 border-white/10 text-white/45 hover:text-white hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={`flex gap-3 overflow-x-auto pb-2 row-scroll transition-opacity duration-150 ${filterLoading ? 'opacity-40' : ''}`}>
        {movies.map((item, i) => (
          <MovieCard key={item.id} item={item} mediaType={mediaType} rank={ranked ? i + 1 : undefined} />
        ))}
      </div>
    </div>
  )
}
