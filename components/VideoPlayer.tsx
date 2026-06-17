'use client'
// components/VideoPlayer.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, RefreshCw, Maximize, Minimize } from 'lucide-react'
import type { VideoSource } from '@/types/tmdb'
import { useKeyboard } from '@/hooks/useKeyboard'

interface VideoPlayerProps {
  movieId: number
  movieTitle: string
  trailerKey: string | null
  mode: 'trailer' | 'stream'
  mediaType: 'movie' | 'tv'
  season?: number
  episode?: number
  onClose: () => void
}

export default function VideoPlayer({
  movieId, movieTitle, trailerKey, mode, mediaType,
  season = 1, episode = 1, onClose,
}: VideoPlayerProps) {
  const [streamUrl, setStreamUrl] = useState('')
  const [fallbacks, setFallbacks] = useState<string[]>([])
  const [fallbackIdx, setFallbackIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hardError, setHardError] = useState(false)      // all sources exhausted
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoFallbackRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }, [])

  // Silent auto-advance fallback — no error flash
  const tryNext = useCallback((currentIdx: number, currentFallbacks: string[]) => {
    const next = currentIdx + 1
    if (next < currentFallbacks.length) {
      setFallbackIdx(next)
      setStreamUrl(currentFallbacks[next])
      setLoading(true)
      setHardError(false)
    } else {
      setHardError(true)
      setLoading(false)
    }
  }, [])

  // Load source
  useEffect(() => {
    setLoading(true)
    setHardError(false)
    setFallbackIdx(0)
    clearTimeout(autoFallbackRef.current)

    if (mode === 'trailer') {
      if (trailerKey) {
        setStreamUrl(`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&color=white`)
        setFallbacks([])
      } else {
        setHardError(true)
      }
      setLoading(false)
      return
    }

    const params = new URLSearchParams({
      id: String(movieId),
      type: mediaType,
      ...(mediaType === 'tv' ? { season: String(season), episode: String(episode) } : {}),
    })

    fetch(`/api/video?${params}`)
      .then(r => r.json())
      .then((data: VideoSource) => {
        setStreamUrl(data.streamUrl)
        setFallbacks(data.fallbacks ?? [])
        setLoading(false)
      })
      .catch(() => { setHardError(true); setLoading(false) })
  }, [movieId, mode, mediaType, season, episode, trailerKey])

  // After iframe loads, clear the loading state
  const handleIframeLoad = useCallback(() => {
    setLoading(false)
    clearTimeout(autoFallbackRef.current)
  }, [])

  // If iframe stalls (30s no load), silently advance
  useEffect(() => {
    if (!streamUrl || hardError || !loading) return
    clearTimeout(autoFallbackRef.current)
    autoFallbackRef.current = setTimeout(() => {
      tryNext(fallbackIdx, fallbacks)
    }, 30_000)
    return () => clearTimeout(autoFallbackRef.current)
  }, [streamUrl, hardError, loading, fallbackIdx, fallbacks, tryNext])

  useKeyboard({
    'Escape': onClose,
    'f': (e) => { e.preventDefault(); toggleFullscreen() },
    'F': (e) => { e.preventDefault(); toggleFullscreen() },
    'n': () => { if (mode === 'stream') tryNext(fallbackIdx, fallbacks) },
    'N': () => { if (mode === 'stream') tryNext(fallbackIdx, fallbacks) },
  }, { ignoreInputs: false })

  return (
    <div ref={containerRef} className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/06 bg-black flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={15} />
          <span className="font-archivo font-extrabold text-display-sm leading-none">
            {movieTitle}
            {mediaType === 'tv' && mode === 'stream' && (
              <span className="ml-2 text-white/40 text-xs font-inter font-normal normal-case tracking-normal">
                S{season} · E{episode}
              </span>
            )}
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Manual source switch — quiet, icon-only */}
          {mode === 'stream' && !hardError && fallbackIdx < fallbacks.length && (
            <button
              onClick={() => tryNext(fallbackIdx, fallbacks)}
              className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded hover:bg-white/08"
              aria-label="Try next source"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded hover:bg-white/08"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </div>

      {/* Player area */}
      <div className="relative flex-1 bg-black">
        {/* Loading — subtle pulse, not a spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-jen1-red animate-pulse" />
          </div>
        )}

        {/* Hard error — all sources exhausted */}
        {hardError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center max-w-xs px-6">
              <p className="text-white/90 font-medium mb-2 text-sm">
                {mode === 'trailer' ? 'No trailer available' : 'Not available right now'}
              </p>
              <p className="text-white/40 text-xs leading-relaxed mb-5">
                This title can't be streamed at the moment. Try again later.
              </p>
              <button
                onClick={onClose}
                className="text-jen1-red text-sm hover:text-red-400 transition-colors"
              >
                Go back
              </button>
            </div>
          </div>
        )}

        {/* Iframe */}
        {!hardError && streamUrl && (
          <iframe
            key={streamUrl}
            src={streamUrl}
            className={`absolute inset-0 w-full h-full border-none transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        )}
      </div>
    </div>
  )
}
