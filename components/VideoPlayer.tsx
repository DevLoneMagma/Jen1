'use client'
// components/VideoPlayer.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, ChevronDown, Maximize, Minimize, Check } from 'lucide-react'
import type { VideoSource } from '@/types/tmdb'
import { labelForUrl } from '@/lib/providerLabels'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

interface ServerOption {
  url: string
  label: string
}

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
  // The full ordered server list (current source first, fallbacks after).
  // Replaces the old "current index into a fallbacks array" approach so the
  // picker UI can jump directly to any server, not just step to "next".
  const [servers, setServers] = useState<ServerOption[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hardError, setHardError] = useState(false)      // all sources exhausted
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const autoFallbackRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const streamUrl = servers[activeIdx]?.url ?? ''

  // Reference-counted body scroll lock — see useBodyScrollLock for why
  // this replaced a plain document.body.style.overflow set/reset (it
  // conflicted with DetailModal's own lock: closing just the player while
  // the modal stayed open would reset overflow to '' on this component's
  // unmount, even though the modal underneath still needed it locked).
  useBodyScrollLock(true)

  // Soft wall-clock progress signal — see WatchEntry.elapsedSeconds for why
  // this can't be a real playback position. Ticks while the player is open
  // in stream mode, so "Continue Watching" can show roughly how far in the
  // user was, not seek-accurate but useful enough to show the row card.
  useEffect(() => {
    if (mode !== 'stream') return
    const start = Date.now()
    const tick = () => {
      window.dispatchEvent(new CustomEvent('track-progress', {
        detail: { id: movieId, type: mediaType, elapsedSeconds: Math.round((Date.now() - start) / 1000) },
      }))
    }
    const interval = setInterval(tick, 15_000)
    return () => { clearInterval(interval); tick() }
  }, [mode, movieId, mediaType])

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }, [])

  // Jump to any server by index — used both by direct picker selection and
  // by the silent stall/auto-advance path below.
  const selectServer = useCallback((idx: number, list: ServerOption[]) => {
    if (idx >= list.length) {
      setHardError(true)
      setLoading(false)
      return
    }
    setActiveIdx(idx)
    setLoading(true)
    setHardError(false)
    setPickerOpen(false)
  }, [])

  // Load source
  useEffect(() => {
    setLoading(true)
    setHardError(false)
    setActiveIdx(0)
    clearTimeout(autoFallbackRef.current)

    if (mode === 'trailer') {
      if (trailerKey) {
        setServers([{
          url: `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&color=white`,
          label: 'YouTube',
        }])
      } else {
        setServers([])
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
        const list: ServerOption[] = [
          { url: data.streamUrl, label: data.label ?? labelForUrl(data.streamUrl) },
          ...(data.fallbacks ?? []).map(url => ({ url, label: labelForUrl(url) })),
        ]
        setServers(list)
        setLoading(false)
      })
      .catch(() => { setHardError(true); setLoading(false) })
  }, [movieId, mode, mediaType, season, episode, trailerKey])

  // After iframe loads, clear the loading state
  const handleIframeLoad = useCallback(() => {
    setLoading(false)
    clearTimeout(autoFallbackRef.current)
  }, [])

  // If iframe stalls (30s no load), silently advance to the next server
  useEffect(() => {
    if (!streamUrl || hardError || !loading) return
    clearTimeout(autoFallbackRef.current)
    autoFallbackRef.current = setTimeout(() => {
      selectServer(activeIdx + 1, servers)
    }, 30_000)
    return () => clearTimeout(autoFallbackRef.current)
  }, [streamUrl, hardError, loading, activeIdx, servers, selectServer])

  useKeyboard({
    'Escape': onClose,
    'f': (e) => { e.preventDefault(); toggleFullscreen() },
    'F': (e) => { e.preventDefault(); toggleFullscreen() },
    'n': () => { if (mode === 'stream') selectServer(activeIdx + 1, servers) },
    'N': () => { if (mode === 'stream') selectServer(activeIdx + 1, servers) },
  }, { ignoreInputs: false })

  // Close the picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

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
          {/* Server picker — replaces the old single "try next" icon with
              direct selection across every available source, labeled by
              provider name rather than a hidden retry action. */}
          {mode === 'stream' && servers.length > 1 && (
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setPickerOpen(o => !o)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md text-white/60 hover:text-white text-xs font-medium transition-colors hover:bg-white/08"
                aria-haspopup="listbox"
                aria-expanded={pickerOpen}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {servers[activeIdx]?.label ?? 'Server'}
                <ChevronDown size={13} className={`transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
              </button>
              {pickerOpen && (
                <div
                  role="listbox"
                  className="absolute top-full right-0 mt-1.5 min-w-[160px] bg-[#161616] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-20 py-1"
                >
                  {servers.map((s, i) => (
                    <button
                      key={s.url}
                      role="option"
                      aria-selected={i === activeIdx}
                      onClick={() => selectServer(i, servers)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors ${
                        i === activeIdx ? 'text-white bg-white/06' : 'text-white/55 hover:text-white hover:bg-white/06'
                      }`}
                    >
                      {s.label}
                      {i === activeIdx && <Check size={12} className="text-jen1-red flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
