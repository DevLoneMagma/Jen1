'use client'
// components/MediaGrid.tsx
// A generalized version of GenrePage's grid for listings that mix movies
// and TV (trending, search results) rather than a single genre's movies.
// GenrePage itself is left as-is — it's movie-only by design today and
// isn't part of this phase's scope — but this shares the same visual
// language (card hover, infinite scroll, skeleton states).

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import type { Movie, TVShow } from '@/types/tmdb'
import { posterUrl, getTitle, getReleaseYear } from '@/lib/tmdb'

type MediaItem = (Movie & { _type: 'movie' }) | (TVShow & { _type: 'tv' })

interface MediaGridProps {
  // Fetches one page of mixed results. Returning fewer than `pageSize`
  // items (or an empty array) signals the end of the list.
  fetchPage: (page: number) => Promise<MediaItem[]>
  emptyMessage?: string
  pageSize?: number
}

export default function MediaGrid({ fetchPage, emptyMessage = 'No titles found', pageSize = 20 }: MediaGridProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)
  const fetchPageRef = useRef(fetchPage)
  fetchPageRef.current = fetchPage

  const loadPage = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const results = await fetchPageRef.current(pageNum)
      setItems(prev => {
        if (pageNum === 1) return results
        const ids = new Set(prev.map(i => `${i._type}-${i.id}`))
        return [...prev, ...results.filter(r => !ids.has(`${r._type}-${r.id}`))]
      })
      setHasMore(results.length >= pageSize && pageNum < 20)
      setPage(pageNum)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [pageSize])

  // Reset and reload whenever the fetch source changes (e.g. a new search query)
  useEffect(() => {
    setInitialLoading(true)
    setItems([])
    setHasMore(true)
    loadPage(1)
    // fetchPage is intentionally excluded — callers pass a new function
    // identity on every render; fetchPageRef above tracks the latest one
    // without retriggering this effect. Re-running on every render would
    // restart the list mid-scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasMore || loading) return
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadPage(page + 1)
    }, { rootMargin: '300px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loading, page, loadPage])

  const openModal = (item: MediaItem) =>
    window.dispatchEvent(new CustomEvent('open-movie', { detail: { id: item.id, type: item._type } }))

  if (initialLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
        {Array.from({ length: 21 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl skeleton" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-white/40 text-lg mb-2">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
        {items.map(item => (
          <MediaGridCard key={`${item._type}-${item.id}`} item={item} onOpen={openModal} />
        ))}
      </div>
      <div ref={loaderRef} className="mt-8 flex justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            Loading more
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-white/20 text-sm">You've reached the end</p>
        )}
      </div>
    </>
  )
}

function MediaGridCard({ item, onOpen }: { item: MediaItem; onOpen: (item: MediaItem) => void }) {
  const title = getTitle(item)
  return (
    <div
      className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(229,9,20,0.45)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)' }}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen(item)}
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
      <div className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white/70 backdrop-blur-sm">
        {item._type === 'tv' ? 'Series' : 'Film'}
      </div>
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
