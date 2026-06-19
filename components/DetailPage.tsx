'use client'
// components/DetailPage.tsx
// Full-page detail view for /movie/[id] and /tv/[id].
// This is the "room to breathe" counterpart to the quick-look DetailModal —
// shareable, indexable, and laid out for a full-width backdrop, a proper
// cast grid, and tabbed sections instead of a single scrolling column.

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Star, ChevronDown, Film } from 'lucide-react'
import type { Movie, TVShow, Video, Credits, Episode } from '@/types/tmdb'
import { posterUrl, backdropUrl, profileUrl, getTrailerKey, getTitle, getReleaseYear } from '@/lib/tmdb'
import VideoPlayer from './VideoPlayer'

type MediaType = 'movie' | 'tv'
type Tab = 'overview' | 'episodes' | 'cast' | 'more'

interface DetailPageProps {
  item: Movie | TVShow
  type: MediaType
  videos: Video[]
  credits: Credits
  recommendations: (Movie | TVShow)[]
}

export default function DetailPage({ item, type, videos, credits, recommendations }: DetailPageProps) {
  const movie = type === 'movie' ? (item as Movie) : null
  const show = type === 'tv' ? (item as TVShow) : null

  const [scrollY, setScrollY] = useState(0)
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [episodesLoading, setEpisodesLoading] = useState(false)

  const [playing, setPlaying] = useState(false)
  const [playMode, setPlayMode] = useState<'trailer' | 'stream'>('stream')

  const [activeTab, setActiveTab] = useState<Tab>(type === 'tv' ? 'episodes' : 'overview')

  // Director / filmography row — fetched on demand when the name is clicked,
  // not at page load. This is the feature that differentiates Jen1 from a
  // straight Netflix clone: a discovery path for people who care who made it.
  const [filmography, setFilmography] = useState<Movie[] | null>(null)
  const [filmographyLoading, setFilmographyLoading] = useState(false)
  const [filmographyError, setFilmographyError] = useState(false)

  const trailerKey = getTrailerKey(videos)
  const cast = credits.cast?.slice(0, 12) ?? []
  const director = credits.crew?.find(c => c.job === 'Director' || c.job === 'Creator')
  const genres = item.genres ?? []
  const runtime = movie?.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null
  const seasons = show?.number_of_seasons

  // Parallax: backdrop moves slower than scroll, with a pronounced depth feel.
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch episode list when season changes (TV only)
  useEffect(() => {
    if (!show) return
    let cancelled = false
    setEpisodesLoading(true)
    fetch(`/api/tmdb?path=/tv/${show.id}/season/${selectedSeason}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setEpisodes(d.episodes ?? []); setEpisodesLoading(false) } })
      .catch(() => { if (!cancelled) setEpisodesLoading(false) })
    return () => { cancelled = true }
  }, [show, selectedSeason])

  const trackPlay = useCallback((season?: number, episode?: number) => {
    window.dispatchEvent(new CustomEvent('track-watch', {
      detail: {
        id: item.id,
        type,
        title: getTitle(item),
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        rating: item.vote_average,
        season,
        episode,
      }
    }))
  }, [item, type])

  const loadFilmography = useCallback(async () => {
    if (!director || filmography || filmographyLoading) return
    setFilmographyLoading(true)
    setFilmographyError(false)
    try {
      const res = await fetch(`/api/tmdb?path=/person/${director.id}/movie_credits`)
      const data = await res.json()
      const films: Movie[] = (data.crew ?? [])
        .filter((c: Movie & { job: string }) => c.job === 'Director' && c.poster_path && c.id !== item.id)
        .sort((a: Movie, b: Movie) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))
        .slice(0, 12)
      setFilmography(films)
    } catch {
      setFilmographyError(true)
    } finally {
      setFilmographyLoading(false)
    }
  }, [director, filmography, filmographyLoading, item.id])

  // 80px of parallax travel, eased by clamping scroll input — pronounced
  // but bounded so the backdrop never scrolls past the header into view.
  const parallaxOffset = Math.min(scrollY * 0.4, 120)
  const backdropOpacity = Math.max(1 - scrollY / 600, 0.25)

  const openRec = (rec: Movie | TVShow) => {
    const recType: MediaType = 'title' in rec ? 'movie' : 'tv'
    window.location.href = `/${recType}/${rec.id}`
  }

  return (
    <div className="min-h-screen bg-jen1-black">
      {/* Full-width parallax backdrop */}
      <div className="relative h-[60vh] min-h-[420px] max-h-[680px] overflow-hidden">
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${parallaxOffset}px) scale(1.15)`, opacity: backdropOpacity }}
        >
          {item.backdrop_path ? (
            <Image
              src={backdropUrl(item.backdrop_path, 'original')}
              alt={getTitle(item)}
              fill
              priority
              className="object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-[#161616]" />
          )}
        </div>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.15) 75%, transparent 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.85) 0%, transparent 55%)' }}
        />

        <Link
          href="/"
          className="absolute top-5 left-5 md:left-12 z-10 flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          ← Home
        </Link>
      </div>

      {/* Header */}
      <div className="relative z-10 -mt-32 md:-mt-40 px-5 md:px-12 pb-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="relative w-32 sm:w-44 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl border border-white/08 mx-auto md:mx-0">
            <Image src={posterUrl(item.poster_path, 'w500')} alt={getTitle(item)} fill className="object-cover" />
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <h1 className="font-archivo font-black text-display-hero mb-3">
              {getTitle(item)}
            </h1>

            {item.tagline && (
              <p className="text-white/40 text-sm italic mb-4">{item.tagline}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-5 text-sm text-white/55">
              {getReleaseYear(item) && <span>{getReleaseYear(item)}</span>}
              {runtime && <span>{runtime}</span>}
              {seasons && <span>{seasons} Season{seasons > 1 ? 's' : ''}</span>}
              <span className="flex items-center gap-1 text-yellow-400/90">
                <Star size={12} fill="currentColor" />
                {item.vote_average?.toFixed(1)}
                <span className="text-white/35">({item.vote_count?.toLocaleString()})</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => { setPlayMode('stream'); setPlaying(true); trackPlay(selectedSeason, selectedEpisode) }}
                className="flex items-center gap-2 bg-jen1-red hover:bg-red-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all hover:scale-[1.03] active:scale-100 shadow-md shadow-red-900/20"
              >
                <Play size={15} fill="currentColor" /> Play
              </button>
              {trailerKey && (
                <button
                  onClick={() => { setPlayMode('trailer'); setPlaying(true) }}
                  className="flex items-center gap-2 bg-white/08 hover:bg-white/14 text-white/85 hover:text-white font-medium text-sm px-5 py-2.5 rounded-lg border border-white/10 transition-all"
                >
                  Trailer
                </button>
              )}
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {genres.map(g => (
                  <a
                    key={g.id}
                    href={`/genre/${encodeURIComponent(g.name.toLowerCase().replace(/\s+/g, '-'))}`}
                    className="text-white/55 hover:text-jen1-red text-xs px-2.5 py-1 rounded-full border border-white/10 hover:border-jen1-red/40 transition-all"
                  >
                    {g.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-10 border-b border-white/08 overflow-x-auto no-scrollbar">
          {([
            ...(type === 'tv' ? [{ id: 'episodes' as Tab, label: 'Episodes' }] : []),
            { id: 'overview' as Tab, label: 'Overview' },
            { id: 'cast' as Tab, label: 'Cast' },
            ...(recommendations.length > 0 ? [{ id: 'more' as Tab, label: 'More Like This' }] : []),
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-jen1-red rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pt-8">
          {activeTab === 'overview' && (
            <div className="max-w-2xl space-y-6">
              {item.overview && (
                <p className="text-white/65 text-[15px] leading-relaxed">{item.overview}</p>
              )}

              <div className="space-y-3 text-sm">
                {director && (
                  <div className="flex gap-3">
                    <span className="text-white/30 w-24 flex-shrink-0 text-xs uppercase tracking-wider pt-0.5">
                      {type === 'tv' ? 'Creator' : 'Director'}
                    </span>
                    <button
                      onClick={() => { setActiveTab('more'); loadFilmography() }}
                      className="text-white/85 font-medium hover:text-jen1-red transition-colors text-left"
                    >
                      {director.name}
                    </button>
                  </div>
                )}
                {movie && ((movie.budget ?? 0) > 0 || (movie.revenue ?? 0) > 0) && (
                  <div className="flex gap-3">
                    <span className="text-white/30 w-24 flex-shrink-0 text-xs uppercase tracking-wider pt-0.5">Numbers</span>
                    <span className="text-white/50 text-xs">
                      {(movie.budget ?? 0) > 0 && `Budget $${(movie.budget! / 1e6).toFixed(0)}M`}
                      {(movie.budget ?? 0) > 0 && (movie.revenue ?? 0) > 0 && '  ·  '}
                      {(movie.revenue ?? 0) > 0 && `Gross $${(movie.revenue! / 1e6).toFixed(0)}M`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'episodes' && show && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={e => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1) }}
                    className="appearance-none bg-white/06 border border-white/12 text-white/80 text-sm px-4 py-2 pr-8 rounded-lg cursor-pointer focus:outline-none focus:border-white/25 hover:bg-white/10 transition-colors"
                  >
                    {Array.from({ length: show.number_of_seasons ?? 1 }, (_, i) => i + 1).map(s => (
                      <option key={s} value={s} className="bg-[#131313]">Season {s}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
                {selectedEpisode && (
                  <button
                    onClick={() => { setPlayMode('stream'); setPlaying(true); trackPlay(selectedSeason, selectedEpisode) }}
                    className="flex items-center gap-1.5 bg-jen1-red hover:bg-red-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all"
                  >
                    <Play size={13} fill="currentColor" /> Play S{selectedSeason} E{selectedEpisode}
                  </button>
                )}
              </div>

              {episodesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-video rounded-xl skeleton" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {episodes.map(ep => (
                    <button
                      key={ep.episode_number}
                      onClick={() => setSelectedEpisode(ep.episode_number)}
                      className={`text-left rounded-xl overflow-hidden border transition-all ${
                        ep.episode_number === selectedEpisode
                          ? 'border-jen1-red/50 bg-jen1-red/10'
                          : 'border-white/08 hover:border-white/20 bg-white/03'
                      }`}
                    >
                      <div className="relative aspect-video bg-[#1a1a1a]">
                        {ep.still_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                            alt={ep.name || `Episode ${ep.episode_number}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/15">
                            <Film size={24} />
                          </div>
                        )}
                        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          ep.episode_number === selectedEpisode ? 'bg-jen1-red text-white' : 'bg-black/70 text-white/70'
                        }`}>
                          {ep.episode_number}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="text-white/85 text-sm font-medium truncate mb-0.5">
                          {ep.name || `Episode ${ep.episode_number}`}
                        </div>
                        <div className="flex items-center gap-2 text-white/35 text-xs">
                          {ep.runtime && <span>{ep.runtime}m</span>}
                          {ep.vote_average > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Star size={9} fill="currentColor" /> {ep.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {ep.overview && (
                          <p className="text-white/40 text-xs leading-relaxed mt-2 line-clamp-2">{ep.overview}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'cast' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cast.map(member => (
                <div key={member.id} className="text-center">
                  <div className="relative w-full aspect-square rounded-full overflow-hidden mb-2 bg-[#1a1a1a] border border-white/08">
                    {member.profile_path ? (
                      <Image src={profileUrl(member.profile_path)} alt={member.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/15 text-2xl font-archivo font-black">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-white/85 text-sm font-medium truncate">{member.name}</div>
                  <div className="text-white/40 text-xs truncate">{member.character}</div>
                </div>
              ))}
              {cast.length === 0 && (
                <p className="text-white/30 text-sm col-span-full">No cast information available.</p>
              )}
            </div>
          )}

          {activeTab === 'more' && (
            <div className="space-y-10">
              {/* Directed by — the discovery feature. Fetched on demand. */}
              {director && (
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-4">
                    More by {director.name}
                  </p>
                  {filmographyLoading ? (
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-28 h-[168px] rounded-xl skeleton" />
                      ))}
                    </div>
                  ) : filmographyError ? (
                    <p className="text-white/30 text-sm">Couldn't load filmography. <button onClick={loadFilmography} className="text-jen1-red hover:underline">Try again</button></p>
                  ) : filmography && filmography.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                      {filmography.map(film => (
                        <button
                          key={film.id}
                          onClick={() => openRec(film)}
                          className="flex-shrink-0 w-28 group/film text-left"
                        >
                          <div className="relative w-28 h-[168px] rounded-xl overflow-hidden mb-2 border border-white/06 group-hover/film:border-jen1-red/30 transition-all">
                            <Image src={posterUrl(film.poster_path)} alt={film.title} fill className="object-cover group-hover/film:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="text-white/65 text-[11px] font-medium truncate leading-tight group-hover/film:text-white/95 transition-colors">
                            {film.title}
                          </div>
                          <div className="text-white/30 text-[10px]">{getReleaseYear(film)}</div>
                        </button>
                      ))}
                    </div>
                  ) : filmography ? (
                    <p className="text-white/30 text-sm">No other directing credits found.</p>
                  ) : (
                    <button
                      onClick={loadFilmography}
                      className="text-white/50 hover:text-white text-sm border border-white/10 hover:border-white/25 rounded-lg px-4 py-2 transition-all"
                    >
                      Show filmography
                    </button>
                  )}
                </div>
              )}

              {/* More Like This */}
              {recommendations.length > 0 && (
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-4">More Like This</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {recommendations.map(rec => (
                      <button
                        key={rec.id}
                        onClick={() => openRec(rec)}
                        className="group/rec text-left"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 border border-white/06 group-hover/rec:border-jen1-red/30 transition-all group-hover/rec:shadow-lg group-hover/rec:shadow-black/50">
                          <Image
                            src={posterUrl(rec.poster_path)}
                            alt={getTitle(rec)}
                            fill
                            className="object-cover group-hover/rec:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/rec:opacity-100 transition-opacity flex items-end justify-center pb-3">
                            <Play size={18} fill="white" className="text-white" />
                          </div>
                        </div>
                        <div className="text-white/65 text-[11px] font-medium truncate leading-tight group-hover/rec:text-white/95 transition-colors">
                          {getTitle(rec)}
                        </div>
                        <div className="text-white/30 text-[10px]">★ {rec.vote_average?.toFixed(1)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player */}
      {playing && (
        <VideoPlayer
          movieId={item.id}
          movieTitle={getTitle(item)}
          trailerKey={playMode === 'trailer' ? trailerKey : null}
          mode={playMode}
          mediaType={type}
          season={selectedSeason}
          episode={selectedEpisode}
          onClose={() => setPlaying(false)}
        />
      )}
    </div>
  )
}
