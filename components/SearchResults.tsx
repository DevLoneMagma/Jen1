'use client'
// components/SearchResults.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Play } from 'lucide-react'
import type { Movie, TVShow } from '@/types/tmdb'
import { posterUrl, getTitle, getReleaseYear } from '@/lib/tmdb'

interface SearchResultsProps {
  query: string
}

const PAGE_SIZE = 20

export default function SearchResults({ query }: SearchResultsProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState(query)
  const [movies, setMovies] = useState<Movie[]>([])
  const [shows, setShows] = useState<TVShow[]>([])
  const [moviePage, setMoviePage] = useState(1)
  const [tvPage, setTvPage] = useState(1)
  const [movieHasMore, setMovieHasMore] = useState(true)
  const [tvHasMore, setTvHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const movieLoaderRef = useRef<HTMLDivElement>(null)
  const tvLoaderRef = useRef<HTMLDivElement>(null)

  // Reset and reload whenever the query (from the URL) changes
  useEffect(() => {
    setInputValue(query)
    if (!query.trim()) {
      setMovies([]); setShows([]); setMovieHasMore(false); setTvHasMore(false)
      return
    }
    setLoading(true)
    setMoviePage(1); setTvPage(1)
    Promise.all([
      fetch(`/api/tmdb?path=/search/movie&query=${encodeURIComponent(query)}&include_adult=false&page=1`).then(r => r.json()),
      fetch(`/api/tmdb?path=/search/tv&query=${encodeURIComponent(query)}&include_adult=false&page=1`).then(r => r.json()),
    ]).then(([m, t]) => {
      const movieResults = (m.results ?? []).filter((x: Movie) => x.poster_path)
      const tvResults = (t.results ?? []).filter((x: TVShow) => x.poster_path)
      setMovies(movieResults)
      setShows(tvResults)
      setMovieHasMore(1 < (m.total_pages ?? 1))
      setTvHasMore(1 < (t.total_pages ?? 1))
    }).finally(() => setLoading(false))
  }, [query])

  const loadMoreMovies = useCallback(async () => {
    if (!movieHasMore || loading) return
    const next = moviePage + 1
    const res = await fetch(`/api/tmdb?path=/search/movie&query=${encodeURIComponent(query)}&include_adult=false&page=${next}`)
    const data = await res.json()
    const results = (data.results ?? []).filter((x: Movie) => x.poster_path)
    setMovies(prev => [...prev, ...results])
    setMoviePage(next)
    setMovieHasMore(next < (data.total_pages ?? 1))
  }, [movieHasMore, loading, moviePage, query])

  const loadMoreTV = useCallback(async () => {
    if (!tvHasMore || loading) return
    const next = tvPage + 1
    const res = await fetch(`/api/tmdb?path=/search/tv&query=${encodeURIComponent(query)}&include_adult=false&page=${next}`)
    const data = await res.json()
    const results = (data.results ?? []).filter((x: TVShow) => x.poster_path)
    setShows(prev => [...prev, ...results])
    setTvPage(next)
    setTvHasMore(next < (data.total_pages ?? 1))
  }, [tvHasMore, loading, tvPage, query])

  useEffect(() => {
    const el = movieLoaderRef.current
    if (!el || !movieHasMore) return
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting) loadMoreMovies() }, { rootMargin: '300px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [movieHasMore, loadMoreMovies])

  useEffect(() => {
    const el = tvLoaderRef.current
    if (!el || !tvHasMore) return
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting) loadMoreTV() }, { rootMargin: '300px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [tvHasMore, loadMoreTV])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`)
  }

  const openModal = (id: number, type: 'movie' | 'tv') =>
    window.dispatchEvent(new CustomEvent('open-movie', { detail: { id, type } }))

  const hasQuery = query.trim().length > 0
  const noResults = hasQuery && !loading && movies.length === 0 && shows.length === 0

  return (
    <div className="pt-20 pb-16 px-6 md:px-12">
      <form onSubmit={handleSubmit} className="max-w-xl mb-8">
        <div className="flex items-center gap-2 px-4 rounded-xl border bg-white/06 border-white/10 focus-within:border-white/25 transition-all">
          <Search size={15} className="text-white/35 flex-shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Search movies and shows…"
            className="flex-1 bg-transparent outline-none text-white text-base py-3 placeholder:text-white/25"
            autoFocus
          />
        </div>
      </form>

      {!hasQuery && (
        <p className="text-white/30 text-sm">Type a title above and press Enter.</p>
      )}

      {loading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {Array.from({ length: 14 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl skeleton" />)}
        </div>
      )}

      {noResults && (
        <div className="py-16 text-center">
          <p className="text-white/40 text-lg mb-1">No results for "{query}"</p>
          <p className="text-white/20 text-sm">Try a different title or spelling</p>
        </div>
      )}

      {!loading && movies.length > 0 && (
        <section className="mb-12">
          <h2 className="font-archivo font-extrabold text-display-md mb-4">Movies</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            {movies.map(m => (
              <SearchCard key={m.id} item={m} type="movie" onOpen={() => openModal(m.id, 'movie')} />
            ))}
          </div>
          {movieHasMore && <div ref={movieLoaderRef} className="h-4 mt-4" />}
        </section>
      )}

      {!loading && shows.length > 0 && (
        <section>
          <h2 className="font-archivo font-extrabold text-display-md mb-4">TV Shows</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            {shows.map(s => (
              <SearchCard key={s.id} item={s} type="tv" onOpen={() => openModal(s.id, 'tv')} />
            ))}
          </div>
          {tvHasMore && <div ref={tvLoaderRef} className="h-4 mt-4" />}
        </section>
      )}
    </div>
  )
}

function SearchCard({ item, type, onOpen }: { item: Movie | TVShow; type: 'movie' | 'tv'; onOpen: () => void }) {
  const title = getTitle(item)
  return (
    <div
      className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(229,9,20,0.45)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)' }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen()}
      aria-label={title}
    >
      <Image
        src={posterUrl(item.poster_path)}
        alt={title}
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
          <div className="text-white text-[11px] font-semibold leading-tight truncate">{title}</div>
          <div className="text-white/45 text-[10px] mt-0.5">
            {getReleaseYear(item)}{item.vote_average ? ` · ★ ${item.vote_average.toFixed(1)}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
