// lib/tmdb.ts
import type { Movie, TVShow, Video, Credits, TMDBResponse, Season, Episode } from '@/types/tmdb'

const API_KEY = process.env.TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
export const IMG_BASE = 'https://image.tmdb.org/t/p'

if (!API_KEY) {
  console.warn('[Jen1] TMDB_API_KEY is not set. Add it to .env.local')
}

async function tmdbFetch<T>(path: string, params: string = ''): Promise<T> {
  const url = `${BASE_URL}${path}?api_key=${API_KEY}${params}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json()
}

// Image helpers
export function posterUrl(path: string | null, size: 'w342' | 'w500' | 'original' = 'w500'): string {
  return path ? `${IMG_BASE}/${size}${path}` : '/placeholder-poster.svg'
}
export function backdropUrl(path: string | null, size: 'w1280' | 'original' = 'w1280'): string {
  return path ? `${IMG_BASE}/${size}${path}` : '/placeholder-backdrop.svg'
}
export function profileUrl(path: string | null): string {
  return path ? `${IMG_BASE}/w185${path}` : ''
}

// ── MOVIES ────────────────────────────────────────────────────────────────────
export async function getTrending(): Promise<Movie[]> {
  const d = await tmdbFetch<TMDBResponse<Movie>>('/trending/movie/week')
  return d.results
}
export async function getPopular(): Promise<Movie[]> {
  const d = await tmdbFetch<TMDBResponse<Movie>>('/movie/popular')
  return d.results
}
export async function getTopRated(): Promise<Movie[]> {
  const d = await tmdbFetch<TMDBResponse<Movie>>('/movie/top_rated')
  return d.results
}
export async function getNowPlaying(): Promise<Movie[]> {
  const d = await tmdbFetch<TMDBResponse<Movie>>('/movie/now_playing')
  return d.results
}
export async function getByGenre(genreId: number, sortBy = 'popularity.desc', minVotes = 0): Promise<Movie[]> {
  const d = await tmdbFetch<TMDBResponse<Movie>>(
    '/discover/movie',
    `&with_genres=${genreId}&sort_by=${sortBy}${minVotes > 0 ? `&vote_count.gte=${minVotes}` : ''}`
  )
  return d.results
}
// NOTE: getMovieDetails / getMovieVideos / getMovieCredits are not called
// anywhere in the current app — the modal fetches everything client-side
// through /api/tmdb instead. These exist for the upcoming server-rendered
// /movie/[id] detail route (Phase 2), which will call TMDB directly from
// the server rather than round-tripping through the client proxy. Keep them.
export async function getMovieDetails(id: number): Promise<Movie> {
  return tmdbFetch<Movie>(`/movie/${id}`)
}
export async function getMovieVideos(id: number): Promise<Video[]> {
  const d = await tmdbFetch<{ results: Video[] }>(`/movie/${id}/videos`)
  return d.results
}
export async function getMovieCredits(id: number): Promise<Credits> {
  return tmdbFetch<Credits>(`/movie/${id}/credits`)
}
// NOTE: not called anywhere yet — reserved for the Phase 2 server-rendered
// /movie/[id] page's "More Like This" section. The modal currently fetches
// recommendations client-side via /api/tmdb instead.
export async function getMovieRecommendations(id: number): Promise<Movie[]> {
  const d = await tmdbFetch<TMDBResponse<Movie>>(`/movie/${id}/recommendations`)
  return d.results.slice(0, 12)
}
export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) return []
  const d = await tmdbFetch<TMDBResponse<Movie>>(
    '/search/movie',
    `&query=${encodeURIComponent(query)}&include_adult=false`
  )
  return d.results.filter((m) => m.poster_path)
}

// ── TV SHOWS ──────────────────────────────────────────────────────────────────
export async function getTrendingTV(): Promise<TVShow[]> {
  const d = await tmdbFetch<TMDBResponse<TVShow>>('/trending/tv/week')
  return d.results
}
export async function getPopularTV(): Promise<TVShow[]> {
  const d = await tmdbFetch<TMDBResponse<TVShow>>('/tv/popular')
  return d.results
}
export async function getTopRatedTV(): Promise<TVShow[]> {
  const d = await tmdbFetch<TMDBResponse<TVShow>>('/tv/top_rated')
  return d.results
}
export async function getTVDetails(id: number): Promise<TVShow> {
  return tmdbFetch<TVShow>(`/tv/${id}`)
}
// NOTE: getTVVideos / getTVCredits are not called anywhere yet — reserved
// for the Phase 2 server-rendered /tv/[id] detail route, same as their
// movie counterparts above.
export async function getTVVideos(id: number): Promise<Video[]> {
  const d = await tmdbFetch<{ results: Video[] }>(`/tv/${id}/videos`)
  return d.results
}
export async function getTVCredits(id: number): Promise<Credits> {
  return tmdbFetch<Credits>(`/tv/${id}/credits`)
}
export async function getTVSeasonEpisodes(id: number, season: number): Promise<Episode[]> {
  const d = await tmdbFetch<{ episodes: Episode[] }>(`/tv/${id}/season/${season}`)
  return d.episodes ?? []
}
// NOTE: not called anywhere yet — reserved for the Phase 2 server-rendered
// /tv/[id] page's "More Like This" section, mirroring getMovieRecommendations.
export async function getTVRecommendations(id: number): Promise<TVShow[]> {
  const d = await tmdbFetch<TMDBResponse<TVShow>>(`/tv/${id}/recommendations`)
  return d.results.slice(0, 12)
}
export async function searchTV(query: string): Promise<TVShow[]> {
  if (!query.trim()) return []
  const d = await tmdbFetch<TMDBResponse<TVShow>>(
    '/search/tv',
    `&query=${encodeURIComponent(query)}&include_adult=false`
  )
  return d.results.filter((s) => s.poster_path)
}

// ── PEOPLE ────────────────────────────────────────────────────────────────────
// Used by the detail page's "Directed by" row: clicking a director's name
// fetches their other movie work in real time, scoped to films where they
// have a Directing credit.
export async function getPersonMovieCredits(personId: number): Promise<Movie[]> {
  const d = await tmdbFetch<{ crew: (Movie & { job: string })[] }>(`/person/${personId}/movie_credits`)
  return d.crew
    .filter(c => c.job === 'Director' && c.poster_path)
    .sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))
}

// ── SHARED ────────────────────────────────────────────────────────────────────
export function getTrailerKey(videos: Video[]): string | null {
  return (
    videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official)?.key ??
    videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube')?.key ??
    videos.find((v) => v.site === 'YouTube')?.key ??
    null
  )
}

export function getTitle(item: Movie | TVShow): string {
  return 'title' in item ? item.title : item.name
}
export function getReleaseYear(item: Movie | TVShow): string {
  const date = 'release_date' in item ? item.release_date : item.first_air_date
  return date?.slice(0, 4) ?? ''
}
