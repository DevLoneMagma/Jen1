'use client'
// components/HeroBanner.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Info, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import type { Movie } from '@/types/tmdb'
import { backdropUrl } from '@/lib/tmdb'
import { useKeyboard } from '@/hooks/useKeyboard'

const TRAILER_LOAD_TIMEOUT_MS = 3000

export default function HeroBanner({ movies }: { movies: Movie[] }) {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const [manualPause, setManualPause] = useState(false)
  const [hovering, setHovering] = useState(false)
  const paused = manualPause || hovering
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Background trailer state — fetched lazily per active slide rather than
  // for all slides up front, since most rotations never reach most slides.
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [muted, setMuted] = useState(true)
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const fetchedForRef = useRef<number | null>(null)

  const advance = useCallback((next: number) => {
    setFading(true)
    setTimeout(() => { setIdx(next); setFading(false) }, 280)
  }, [])

  const prev = useCallback(() => advance((idx - 1 + movies.length) % movies.length), [idx, movies.length, advance])
  const next = useCallback(() => advance((idx + 1) % movies.length), [idx, movies.length, advance])

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(next, 7000)
    return () => clearInterval(timerRef.current)
  }, [paused, next])

  const movie = movies[idx]

  // Reset video state on slide change, then fetch this slide's trailer key.
  // A 3s timeout guards against a slow/failed TMDB response or a YouTube
  // embed that never fires onLoad — past that point we give up silently
  // and just keep showing the still backdrop, per the original spec.
  useEffect(() => {
    setVideoReady(false)
    setTrailerKey(null)
    clearTimeout(loadTimeoutRef.current)
    if (!movie) return

    let cancelled = false
    fetchedForRef.current = movie.id

    fetch(`/api/tmdb?path=/movie/${movie.id}/videos`)
      .then(r => r.json())
      .then(d => {
        if (cancelled || fetchedForRef.current !== movie.id) return
        const key =
          d.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube' && v.official)?.key ??
          d.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key ??
          null
        if (key) {
          setTrailerKey(key)
          loadTimeoutRef.current = setTimeout(() => {
            // The iframe never confirmed it actually started playing —
            // bail out to the still image rather than show a stalled embed.
            setTrailerKey(null)
          }, TRAILER_LOAD_TIMEOUT_MS)
        }
      })
      .catch(() => { /* silent fallback to still backdrop */ })

    return () => { cancelled = true; clearTimeout(loadTimeoutRef.current) }
  }, [movie?.id])

  const handleVideoReady = useCallback(() => {
    clearTimeout(loadTimeoutRef.current)
    setVideoReady(true)
  }, [])

  const openModal = (id: number) => window.dispatchEvent(new CustomEvent('open-movie', { detail: { id } }))
  const playTrailer = (id: number) => window.dispatchEvent(new CustomEvent('play-trailer', { detail: { id } }))

  useKeyboard({
    'ArrowLeft':  (e) => { e.preventDefault(); prev() },
    'ArrowRight': (e) => { e.preventDefault(); next() },
    ' ': (e) => { e.preventDefault(); setManualPause(p => !p) },
    'Enter': () => movie && openModal(movie.id),
    't': () => movie && playTrailer(movie.id),
    'T': () => movie && playTrailer(movie.id),
    'm': () => setMuted(m => !m),
    'M': () => setMuted(m => !m),
  })

  if (!movie) return null

  const showVideo = trailerKey && videoReady && !fading

  return (
    <div
      className="relative h-[90vh] min-h-[520px] flex items-end overflow-hidden group/hero"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Still backdrop — always present as the base layer/fallback */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url(${backdropUrl(movie.backdrop_path, 'original')})`,
          opacity: fading ? 0 : showVideo ? 0 : 1,
        }}
      />

      {/* Muted looping trailer background — fades in once it confirms it's
          actually playing. The iframe is given a generous bounding box
          (118% scale) so YouTube's own letterboxing never shows at the
          hero's edges. pointer-events-none keeps it purely decorative. */}
      {trailerKey && (
        <div
          className="absolute inset-0 overflow-hidden transition-opacity duration-700 pointer-events-none"
          style={{ opacity: showVideo ? 1 : 0 }}
        >
          <iframe
            key={`${movie.id}-${trailerKey}`}
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&playsinline=1&rel=0&enablejsapi=1`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[118%] h-[118%] min-w-[1200px] min-h-[675px]"
            style={{ aspectRatio: '16/9' }}
            allow="autoplay; encrypted-media"
            onLoad={handleVideoReady}
            title=""
            tabIndex={-1}
          />
        </div>
      )}

      {/* Asymmetric gradient — heavy left, feathers right */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(105deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.05) 100%)',
      }} />
      {/* Bottom fade into rows */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.5) 18%, transparent 40%)',
      }} />

      {/* Prev/Next — appear on hover, subtle */}
      <button
        onClick={prev}
        aria-label="Previous"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 border border-white/10 text-white/60 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 hover:text-white hover:bg-black/70 transition-all duration-200"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        aria-label="Next"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 border border-white/10 text-white/60 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 hover:text-white hover:bg-black/70 transition-all duration-200"
      >
        <ChevronRight size={18} />
      </button>

      {/* Mute toggle — only meaningful once the background video is live */}
      {showVideo && (
        <button
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
          className="absolute right-4 bottom-28 md:bottom-32 z-10 w-9 h-9 rounded-full bg-black/40 border border-white/15 text-white/70 flex items-center justify-center hover:text-white hover:bg-black/70 transition-all duration-200 backdrop-blur-sm"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}

      {/* Content */}
      <div className={`relative z-10 px-6 md:px-12 pb-20 max-w-xl transition-all duration-500 ${fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        {/* Title — no badge, just scale */}
        <h1 className="font-archivo font-black text-display-hero mb-5" style={{ textShadow: '0 2px 30px rgba(0,0,0,0.9)' }}>
          {movie.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-white/50 mb-5">
          <span className="text-yellow-400/90 font-medium">★ {movie.vote_average?.toFixed(1)}</span>
          <span>{movie.release_date?.slice(0, 4)}</span>
          <span className="uppercase text-xs tracking-wider">{movie.original_language}</span>
        </div>

        <p className="text-white/65 text-[15px] leading-relaxed mb-8 max-w-md">
          {movie.overview?.slice(0, 180)}{(movie.overview?.length ?? 0) > 180 ? '…' : ''}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => playTrailer(movie.id)}
            className="flex items-center gap-2 bg-white text-jen1-black font-semibold px-6 py-3 rounded-md transition-all duration-150 hover:scale-[1.03] hover:bg-white/90 active:scale-100 shadow-lg"
          >
            <Play size={15} fill="currentColor" /> Play
          </button>
          <button
            onClick={() => openModal(movie.id)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/16 text-white font-medium px-5 py-3 rounded-md border border-white/15 transition-all duration-150 backdrop-blur-sm"
          >
            <Info size={15} /> More Info
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-8 left-6 md:left-12 flex gap-2 z-10">
        {movies.map((_, i) => (
          <button
            key={i}
            onClick={() => { if (i !== idx) advance(i) }}
            className={`h-0.5 rounded-full transition-all duration-300 ${i === idx ? 'w-8 bg-jen1-red' : 'w-5 bg-white/25 hover:bg-white/45'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
