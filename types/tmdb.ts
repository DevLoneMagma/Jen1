// types/tmdb.ts

export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
  genres?: Genre[]
  runtime?: number
  status?: string
  budget?: number
  revenue?: number
  original_language: string
  popularity: number
  tagline?: string
}

export interface TVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
  genres?: Genre[]
  number_of_seasons?: number
  number_of_episodes?: number
  status?: string
  original_language: string
  popularity: number
  tagline?: string
  seasons?: Season[]
  episode_run_time?: number[]
}

export interface Season {
  id: number
  season_number: number
  episode_count: number
  name: string
  overview: string
  poster_path: string | null
  air_date: string
}

export interface Episode {
  id: number
  episode_number: number
  name: string
  overview: string
  still_path: string | null
  vote_average: number
  runtime: number | null
  air_date: string
}

export interface Genre {
  id: number
  name: string
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface CrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface Credits {
  cast: CastMember[]
  crew: CrewMember[]
}

export interface TMDBResponse<T> {
  results: T[]
  page: number
  total_pages: number
  total_results: number
}

export interface VideoSource {
  streamUrl: string
  source: string
  fallbacks?: string[]
  label?: string
}

// Union type for search / rows that can be movie or TV
export type MediaItem = (Movie & { media_type: 'movie' }) | (TVShow & { media_type: 'tv' })
