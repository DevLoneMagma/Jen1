'use client'
// components/DetailModal.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Play, Star, ChevronDown, Maximize2 } from 'lucide-react'
import type { Movie, TVShow, Video, Credits, Episode } from '@/types/tmdb'
import { posterUrl, backdropUrl, getTrailerKey, getTitle, getReleaseYear } from '@/lib/tmdb'
import { getModalData } from '@/lib/modalCache'
import VideoPlayer from './VideoPlayer'
import { useKeyboard } from '@/hooks/useKeyboard'

type MediaType = 'movie' | 'tv'

export default function DetailModal() {
  const [current, setCurrent] = useState<{ id: number; type: MediaType } | null>(null)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [show, setShow] = useState<TVShow | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [credits, setCredits] = useState<Credits | null>(null)
  const [recommendations, setRecommendations] = useState<(Movie | TVShow)[]>([])
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)

  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [episodesLoading, setEpisodesLoading] = useState(false)

  const [playing, setPlaying] = useState(false)
  const [playMode, setPlayMode] = useState<'trailer' | 'stream'>('stream')

  const scrollRef = useRef<HTMLDivElement>(null)

  const item = movie ?? show
  const type: MediaType = show ? 'tv' : 'movie'
  const trailerKey = getTrailerKey(videos)

  const trackPlay = (season?: number, episode?: number) => {
    if (!item) return
    window.dispatchEvent(new CustomEvent('track-watch', {
      detail: {
        id: current!.id,
        type,
        title: getTitle(item as Movie | TVShow),
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        rating: item.vote_average,
        season,
        episode,
      }
    }))
  }

  const openItem = useCallback(async (
    id: number,
    mediaType: MediaType = 'movie',
    initialSeason?: number,
    initialEpisode?: number
  ) => {
    setClosing(false)
    setLoading(true)
    setPlaying(false)
    setMovie(null); setShow(null)
    setVideos([]); setCredits(null); setRecommendations([])
    // Reset first, then apply any requested initial season/episode —
    // these run synchronously in the same tick as the reset above, so
    // a caller's initial values can never be wiped out by this reset.
    setSelectedSeason(initialSeason ?? 1)
    setSelectedEpisode(initialEpisode ?? 1)
    setEpisodes([])
    setCurrent({ id, type: mediaType })
    scrollRef.current?.scrollTo(0, 0)

    const { details, videos: vids, credits: creds, recommendations: recs } = await getModalData(id, mediaType)
    if (mediaType === 'tv') setShow(details); else setMovie(details)
    setVideos(vids.results ?? [])
    setCredits(creds)
    setRecommendations((recs.results ?? []).filter((m: Movie | TVShow) => m.poster_path).slice(0, 12))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!show) return
    setEpisodesLoading(true)
    fetch(`/api/tmdb?path=/tv/${show.id}/season/${selectedSeason}`)
      .then(r => r.json())
      .then(d => { setEpisodes(d.episodes ?? []); setEpisodesLoading(false) })
      .catch(() => setEpisodesLoading(false))
  }, [show, selectedSeason])

  useEffect(() => {
    const onOpen = (e: Event) => {
      const ev = e as CustomEvent<{ id: number; type?: MediaType }>
      openItem(ev.detail.id, ev.detail.type ?? 'movie')
    }
    const onTrailer = (e: Event) => {
      const ev = e as CustomEvent<{ id: number; type?: MediaType }>
      openItem(ev.detail.id, ev.detail.type ?? 'movie')
      setTimeout(() => { setPlayMode('trailer'); setPlaying(true) }, 900)
    }
    const onResume = async (e: Event) => {
      const ev = e as CustomEvent<{ id: number; type: 'movie' | 'tv'; season?: number; episode?: number }>
      const d = ev.detail
      await openItem(d.id, d.type, d.season, d.episode)
      setPlayMode('stream')
      setPlaying(true)
    }
    window.addEventListener('open-movie', onOpen)
    window.addEventListener('play-trailer', onTrailer)
    window.addEventListener('resume-watching', onResume)
    return () => {
      window.removeEventListener('open-movie', onOpen)
      window.removeEventListener('play-trailer', onTrailer)
      window.removeEventListener('resume-watching', onResume)
    }
  }, [openItem])

  const close = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setCurrent(null); setMovie(null); setShow(null); setPlaying(false); setClosing(false)
    }, 200)
  }, [])

  useKeyboard({
    'Escape': () => { if (playing) setPlaying(false); else close() },
    'p': () => { if (item) { setPlayMode('stream'); setPlaying(true) } },
    'P': () => { if (item) { setPlayMode('stream'); setPlaying(true) } },
    't': () => { if (item && trailerKey) { setPlayMode('trailer'); setPlaying(true) } },
    'T': () => { if (item && trailerKey) { setPlayMode('trailer'); setPlaying(true) } },
  }, { enabled: !!current && !playing })

  useEffect(() => {
    if (current) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [current])

  const cast = credits?.cast?.slice(0, 5).map(c => c.name).join(', ')
  const director = credits?.crew?.find(c => c.job === 'Director' || c.job === 'Creator')
  const genres = item && 'genres' in item ? item.genres?.map(g => g.name) ?? [] : []
  const runtime = movie?.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null
  const seasons = show?.number_of_seasons

  if (!current) return null

  const isAnimating = closing

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 ${isAnimating ? 'scrim-exit' : 'scrim-enter'}`}
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
        onClick={e => e.target === e.currentTarget && close()}
      >
        <div className={`bg-[#131313] rounded-none sm:rounded-2xl w-full max-w-2xl max-h-screen sm:max-h-[88vh] overflow-hidden flex flex-col shadow-2xl border border-white/05 ${isAnimating ? 'modal-exit' : 'modal-enter'}`}>

          {/* Backdrop */}
          <div className="relative h-52 sm:h-60 flex-shrink-0">
            {loading ? (
              <div className="w-full h-full skeleton" />
            ) : item?.backdrop_path ? (
              <Image src={backdropUrl(item.backdrop_path)} alt={getTitle(item)} fill className="object-cover object-top" priority />
            ) : (
              <div className="w-full h-full bg-[#1a1a1a]" />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,#131313 0%,rgba(19,19,19,0.2) 60%,transparent 100%)' }} />
            {item && (
              <Link
                href={`/${type}/${current.id}`}
                className="absolute top-3 right-[52px] flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/50 border border-white/15 text-white/70 text-xs font-medium hover:text-white hover:bg-black/80 transition-all"
              >
                <Maximize2 size={12} /> Full page
              </Link>
            )}
            <button
              onClick={close}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/15 text-white/70 flex items-center justify-center hover:text-white hover:bg-black/80 transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="overflow-y-auto flex-1 px-5 sm:px-6 pb-8">
            {loading && !item ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-jen1-red/50 border-t-jen1-red rounded-full animate-spin" />
              </div>
            ) : item ? (
              <>
                {/* Header */}
                <div className="flex gap-4 -mt-10 relative z-10 items-end mb-6">
                  <div className="relative w-[72px] sm:w-24 h-[108px] sm:h-36 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl border border-white/08">
                    <Image src={posterUrl(item.poster_path)} alt={getTitle(item)} fill className="object-cover" />
                  </div>
                  <div className="flex-1 pb-0.5 min-w-0">
                    <h2 className="font-archivo font-extrabold text-display-lg mb-1.5">
                      {getTitle(item)}
                    </h2>
                    {'tagline' in item && item.tagline && (
                      <p className="text-white/35 text-xs italic mb-2 truncate">{item.tagline}</p>
                    )}
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-xs text-white/45">
                      {getReleaseYear(item) && <span>{getReleaseYear(item)}</span>}
                      {runtime && <span>{runtime}</span>}
                      {seasons && <span>{seasons} Season{seasons > 1 ? 's' : ''}</span>}
                      <span className="flex items-center gap-1 text-yellow-400/80">
                        <Star size={10} fill="currentColor" />
                        {item.vote_average?.toFixed(1)}
                        <span className="text-white/30">({item.vote_count?.toLocaleString()})</span>
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPlayMode('stream'); setPlaying(true); trackPlay(selectedSeason, selectedEpisode) }}
                        className="flex items-center gap-1.5 bg-jen1-red hover:bg-red-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all hover:scale-[1.03] active:scale-100 shadow-md shadow-red-900/20"
                      >
                        <Play size={13} fill="currentColor" /> Play
                      </button>
                      {trailerKey && (
                        <button
                          onClick={() => { setPlayMode('trailer'); setPlaying(true) }}
                          className="flex items-center gap-1.5 bg-white/08 hover:bg-white/14 text-white/80 hover:text-white font-medium text-sm px-4 py-2 rounded-lg border border-white/10 transition-all"
                        >
                          Trailer
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overview */}
                {item.overview && (
                  <p className="text-white/60 text-sm leading-relaxed mb-6">{item.overview}</p>
                )}

                {/* Info */}
                <div className="space-y-3 mb-6 text-sm">
                  {director && (
                    <div className="flex gap-3">
                      <span className="text-white/30 w-20 flex-shrink-0 text-xs uppercase tracking-wider pt-0.5">
                        {type === 'tv' ? 'Creator' : 'Director'}
                      </span>
                      <span className="text-white/80 font-medium">{director.name}</span>
                    </div>
                  )}
                  {cast && (
                    <div className="flex gap-3">
                      <span className="text-white/30 w-20 flex-shrink-0 text-xs uppercase tracking-wider pt-0.5">Cast</span>
                      <span className="text-white/60">{cast}</span>
                    </div>
                  )}
                  {genres.length > 0 && (
                    <div className="flex gap-3">
                      <span className="text-white/30 w-20 flex-shrink-0 text-xs uppercase tracking-wider pt-0.5">Genre</span>
                      <div className="flex flex-wrap gap-1.5">
                        {genres.map(g => (
                          <a
                            key={g}
                            href={`/genre/${encodeURIComponent(g.toLowerCase().replace(/\s+/g, '-'))}`}
                            className="text-white/55 hover:text-jen1-red text-xs px-2 py-0.5 rounded-full border border-white/10 hover:border-jen1-red/40 transition-all"
                          >
                            {g}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {type === 'movie' && ((movie?.budget ?? 0) > 0 || (movie?.revenue ?? 0) > 0) && (
                    <div className="flex gap-3">
                      <span className="text-white/30 w-20 flex-shrink-0 text-xs uppercase tracking-wider pt-0.5">Numbers</span>
                      <span className="text-white/50 text-xs">
                        {(movie?.budget ?? 0) > 0 && `Budget $${((movie!.budget!) / 1e6).toFixed(0)}M`}
                        {(movie?.budget ?? 0) > 0 && (movie?.revenue ?? 0) > 0 && '  ·  '}
                        {(movie?.revenue ?? 0) > 0 && `Gross $${((movie!.revenue!) / 1e6).toFixed(0)}M`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/06 mb-6" />

                {/* TV Episode picker */}
                {type === 'tv' && show && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <select
                          value={selectedSeason}
                          onChange={e => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1) }}
                          className="appearance-none bg-white/06 border border-white/12 text-white/80 text-sm px-3 py-1.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:border-white/25 hover:bg-white/10 transition-colors"
                        >
                          {Array.from({ length: show.number_of_seasons ?? 1 }, (_, i) => i + 1).map(s => (
                            <option key={s} value={s} className="bg-[#131313]">Season {s}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                      </div>
                    </div>

                    {!episodesLoading && episodes.length > 0 && (
                      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                        {episodes.map(ep => (
                          <button
                            key={ep.episode_number}
                            onClick={() => { setSelectedEpisode(ep.episode_number); setPlayMode('stream'); setPlaying(true); trackPlay(selectedSeason, ep.episode_number) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                              ep.episode_number === selectedEpisode
                                ? 'bg-jen1-red/15 border border-jen1-red/20'
                                : 'hover:bg-white/05 border border-transparent'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                              ep.episode_number === selectedEpisode ? 'bg-jen1-red text-white' : 'bg-white/08 text-white/40'
                            }`}>
                              {ep.episode_number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white/80 text-xs font-medium truncate">
                                {ep.name || `Episode ${ep.episode_number}`}
                              </div>
                              {ep.runtime && <div className="text-white/25 text-[10px]">{ep.runtime}m</div>}
                            </div>
                            <Play size={11} className="text-white/25 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="w-full h-px bg-white/06 mt-6 mb-6" />
                  </div>
                )}

                {/* More Like This */}
                {recommendations.length > 0 && (
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-4">More Like This</p>
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                      {recommendations.map(rec => (
                        <button
                          key={rec.id}
                          onClick={() => openItem(rec.id, 'title' in rec ? 'movie' : 'tv')}
                          className="flex-shrink-0 w-24 group/rec text-left"
                        >
                          <div className="relative w-24 h-36 rounded-xl overflow-hidden mb-2 border border-white/06 group-hover/rec:border-jen1-red/30 transition-all duration-200 group-hover/rec:shadow-lg group-hover/rec:shadow-black/50">
                            <Image
                              src={posterUrl(rec.poster_path)}
                              alt={getTitle(rec as Movie | TVShow)}
                              fill
                              className="object-cover group-hover/rec:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/rec:opacity-100 transition-opacity flex items-end justify-center pb-2">
                              <Play size={16} fill="white" className="text-white" />
                            </div>
                          </div>
                          <div className="text-white/60 text-[10px] font-medium truncate leading-tight group-hover/rec:text-white/90 transition-colors">
                            {getTitle(rec as Movie | TVShow)}
                          </div>
                          <div className="text-white/25 text-[10px]">★ {rec.vote_average?.toFixed(1)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Player */}
      {playing && current && item && (
        <VideoPlayer
          movieId={current.id}
          movieTitle={getTitle(item as Movie | TVShow)}
          trailerKey={playMode === 'trailer' ? trailerKey : null}
          mode={playMode}
          mediaType={type}
          season={selectedSeason}
          episode={selectedEpisode}
          onClose={() => setPlaying(false)}
        />
      )}
    </>
  )
}
