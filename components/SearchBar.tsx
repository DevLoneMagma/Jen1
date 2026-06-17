'use client'
// components/SearchBar.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Film, Tv } from 'lucide-react'
import type { Movie, TVShow } from '@/types/tmdb'
import { posterUrl, getTitle, getReleaseYear } from '@/lib/tmdb'
import Image from 'next/image'

type ResultItem = (Movie & { _type: 'movie' }) | (TVShow & { _type: 'tv' })

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  // S / / focuses search globally
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable
      if (isInput) return
      if (e.key === 's' || e.key === 'S' || e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const [moviesRes, showsRes] = await Promise.all([
        fetch(`/api/tmdb?path=/search/movie&query=${encodeURIComponent(q)}&include_adult=false`).then(r => r.json()),
        fetch(`/api/tmdb?path=/search/tv&query=${encodeURIComponent(q)}&include_adult=false`).then(r => r.json()),
      ])
      const movies: ResultItem[] = (moviesRes.results ?? []).filter((m: Movie) => m.poster_path).slice(0, 4).map((m: Movie) => ({ ...m, _type: 'movie' as const }))
      const shows: ResultItem[] = (showsRes.results ?? []).filter((s: TVShow) => s.poster_path).slice(0, 3).map((s: TVShow) => ({ ...s, _type: 'tv' as const }))
      const combined = [...movies, ...shows].sort((a, b) => b.popularity - a.popularity).slice(0, 7)
      setResults(combined)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val); setActiveIdx(-1)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 320)
  }

  const clear = () => { setQuery(''); setResults([]); setActiveIdx(-1); inputRef.current?.focus() }

  const openItem = (item: ResultItem) => {
    setQuery(''); setResults([]); setFocused(false); setActiveIdx(-1)
    window.dispatchEvent(new CustomEvent('open-movie', { detail: { id: item.id, type: item._type } }))
  }

  const goToSearchPage = () => {
    if (!query.trim()) return
    setFocused(false)
    inputRef.current?.blur()
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && results[activeIdx]) openItem(results[activeIdx])
      else goToSearchPage()
    }
    else if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur() }
  }

  const showDropdown = focused && (results.length > 0 || loading)

  return (
    <div className="relative w-full max-w-xs">
      <div className={`flex items-center gap-2 px-3 rounded-xl border transition-all duration-200 ${
        focused ? 'bg-white/10 border-white/20 max-w-sm' : 'bg-white/06 border-white/08'
      }`}>
        <Search size={13} className="text-white/35 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search…"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="flex-1 bg-transparent outline-none text-white text-sm py-2 placeholder:text-white/25"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button onClick={clear} className="text-white/30 hover:text-white transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 min-w-[280px] bg-[#141414] rounded-xl border border-white/08 overflow-hidden shadow-2xl z-50">
          {loading && (
            <div className="flex items-center justify-center py-5">
              <div className="w-4 h-4 border-2 border-jen1-red/50 border-t-jen1-red rounded-full animate-spin" />
            </div>
          )}
          {!loading && results.map((item, i) => (
            <button
              key={`${item._type}-${item.id}`}
              onClick={() => openItem(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                i === activeIdx ? 'bg-white/10' : 'hover:bg-white/06'
              }`}
            >
              <div className="relative w-8 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/05">
                <Image src={posterUrl(item.poster_path, 'w342')} alt={getTitle(item as Movie | TVShow)} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white/90 text-sm font-medium truncate">{getTitle(item as Movie | TVShow)}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    item._type === 'tv' ? 'bg-blue-500/15 text-blue-400' : 'bg-jen1-red/15 text-jen1-red'
                  }`}>
                    {item._type === 'tv' ? 'Series' : 'Film'}
                  </span>
                  <span className="text-white/35 text-[11px]">{getReleaseYear(item as Movie | TVShow)}</span>
                  <span className="text-yellow-400/60 text-[11px]">★ {item.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            </button>
          ))}
          {!loading && results.length === 0 && query && (
            <div className="px-4 py-5 text-white/30 text-sm text-center">No results</div>
          )}
          {!loading && results.length > 0 && (
            <button
              onClick={goToSearchPage}
              className="w-full text-center text-white/45 hover:text-white text-xs font-medium py-2.5 border-t border-white/06 hover:bg-white/04 transition-colors"
            >
              See all results for "{query}" →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
