'use client'
// components/GenrePage.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { ArrowLeft, Play, SlidersHorizontal } from 'lucide-react'
import type { Movie } from '@/types/tmdb'
import { posterUrl } from '@/lib/tmdb'

type SortOption = 'popularity.desc' | 'vote_average.desc' | 'release_date.desc' | 'revenue.desc'

interface GenrePageProps {
  genreId: number | null
  genreName: string
  slug: string
}

const SORT_LABELS: Record<SortOption, string> = {
  'popularity.desc':   'Most Popular',
  'vote_average.desc': 'Highest Rated',
  'release_date.desc': 'Newest First',
  'revenue.desc':      'Box Office',
}

export default function GenrePage({ genreId, genreName, slug }: GenrePageProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [sort, setSort] = useState<SortOption>('popularity.desc')
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchPage = useCallback(async (pageNum: number, sortBy: SortOption, rating: number, reset = false) => {
    if (!genreId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        path: '/discover/movie',
        with_genres: String(genreId),
        sort_by: sortBy,
        page: String(pageNum),
        'vote_count.gte': '50',
        ...(rating > 0 ? { 'vote_average.gte': String(rating) } : {}),
      })
      const res = await fetch(`/api/tmdb?${params}`)
      const data = await res.json()
      const results: Movie[] = (data.results ?? []).filter((m: Movie) => m.poster_path)
      if (reset) {
        setMovies(results)
      } else {
        setMovies(prev => {
          const ids = new Set(prev.map(m => m.id))
          return [...prev, ...results.filter(m => !ids.has(m.id))]
        })
      }
      setHasMore(pageNum < (data.total_pages ?? 1) && pageNum < 20)
      setPage(pageNum)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [genreId])

  // Initial load
  useEffect(() => {
    setInitialLoading(true)
    setMovies([])
    setPage(1)
    setHasMore(true)
    fetchPage(1, sort, minRating, true)
  }, [sort, minRating, fetchPage])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading) return
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) fetchPage(page + 1, sort, minRating)
    }, { rootMargin: '300px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loading, page, sort, minRating, fetchPage])

  const openModal = (id: number) =>
    window.dispatchEvent(new CustomEvent('open-movie', { detail: { id, type: 'movie' } }))

  return (
    <div className="min-h-screen bg-jen1-black pt-20 pb-16 px-6 md:px-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-white/35 hover:text-white text-sm transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Home
          </a>
          <h1 className="font-archivo font-black text-display-hero">
            {genreName}
          </h1>
          {movies.length > 0 && !initialLoading && (
            <p className="text-white/30 text-sm mt-2">
              Showing {movies.length} titles
            </p>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all mt-10 ${
            showFilters || minRating > 0
              ? 'bg-jen1-red/15 border-jen1-red/30 text-jen1-red'
              : 'bg-white/06 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-[#141414] border border-white/08 rounded-2xl p-5 mb-8 flex flex-wrap gap-6">
          {/* Sort */}
          <div>
            <div className="text-white/30 text-xs uppercase tracking-wider mb-3">Sort By</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                <button
                  key={opt}
                  onClick={() => setSort(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sort === opt
                      ? 'bg-jen1-red text-white'
                      : 'bg-white/06 text-white/50 hover:text-white hover:bg-white/12 border border-white/08'
                  }`}
                >
                  {SORT_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>

          {/* Min rating */}
          <div>
            <div className="text-white/30 text-xs uppercase tracking-wider mb-3">
              Min Rating {minRating > 0 ? <span className="text-jen1-red">★ {minRating}+</span> : ''}
            </div>
            <div className="flex gap-2">
              {[0, 6, 7, 7.5, 8].map(r => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    minRating === r
                      ? 'bg-jen1-red text-white'
                      : 'bg-white/06 text-white/50 hover:text-white hover:bg-white/12 border border-white/08'
                  }`}
                >
                  {r === 0 ? 'Any' : `★ ${r}+`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {initialLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl skeleton" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            {movies.map(movie => (
              <GenreCard key={movie.id} movie={movie} onOpen={openModal} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={loaderRef} className="mt-8 flex justify-center">
            {loading && (
              <div className="flex items-center gap-2 text-white/30 text-sm">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                Loading more
              </div>
            )}
            {!hasMore && movies.length > 0 && (
              <p className="text-white/20 text-sm">You've reached the end</p>
            )}
          </div>
        </>
      )}

      {!initialLoading && movies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-white/40 text-lg mb-2">No titles found</p>
          <p className="text-white/20 text-sm">Try adjusting the filters</p>
        </div>
      )}
    </div>
  )
}

function GenreCard({ movie, onOpen }: { movie: Movie; onOpen: (id: number) => void }) {
  return (
    <div
      className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(229,9,20,0.45)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)' }}
      onClick={() => onOpen(movie.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen(movie.id)}
      aria-label={movie.title}
    >
      <Image
        src={posterUrl(movie.poster_path)}
        alt={movie.title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-jen1-red rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-200 shadow-xl">
          <Play size={14} fill="white" className="ml-0.5" />
        </div>
        <div className="absolute bottom-0 inset-x-0 p-3">
          <div className="text-white text-[11px] font-semibold leading-tight truncate">{movie.title}</div>
          <div className="text-white/45 text-[10px] mt-0.5">
            {movie.release_date?.slice(0, 4)}{movie.vote_average ? ` · ★ ${movie.vote_average.toFixed(1)}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
