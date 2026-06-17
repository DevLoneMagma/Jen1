// app/page.tsx
import { Suspense } from 'react'
import {
  getTrending, getPopular, getTopRated, getNowPlaying, getByGenre,
  getTrendingTV, getPopularTV, getTopRatedTV,
} from '@/lib/tmdb'
import HeroBanner from '@/components/HeroBanner'
import MovieRow from '@/components/MovieRow'
import ContinueWatching from '@/components/ContinueWatching'
import Navbar from '@/components/Navbar'
import SkeletonRow from '@/components/SkeletonRow'

async function getAllContent() {
  const [
    trending, popular, topRated, nowPlaying, action, scifi,
    trendingTV, popularTV, topRatedTV,
  ] = await Promise.all([
    getTrending(),
    getPopular(),
    getTopRated(),
    getNowPlaying(),
    getByGenre(28),
    getByGenre(878, 'vote_average.desc', 500),
    getTrendingTV(),
    getPopularTV(),
    getTopRatedTV(),
  ])
  return { trending, popular, topRated, nowPlaying, action, scifi, trendingTV, popularTV, topRatedTV }
}

export default async function HomePage() {
  const {
    trending, popular, topRated, nowPlaying, action, scifi,
    trendingTV, popularTV, topRatedTV,
  } = await getAllContent()

  return (
    <main className="min-h-screen bg-jen1-black">
      <Navbar />

      {/* Hero with skeleton fallback */}
      <Suspense fallback={
        <div className="relative h-[90vh] min-h-[520px] skeleton">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 50%)' }} />
        </div>
      }>
        <HeroBanner movies={trending.slice(0, 6)} />
      </Suspense>

      <div className="relative z-10 -mt-8 pb-16 space-y-8 px-6 md:px-12">
        {/* Continue Watching — client-only, renders from localStorage */}
        <ContinueWatching />

        <Suspense fallback={<SkeletonRow title="Trending Now" />}>
          <MovieRow
            title="Trending Now"
            movies={trending.slice(0, 15)}
            accent
            mediaType="movie"
            ranked
            exploreHref="/trending"
          />
        </Suspense>

        <Suspense fallback={<SkeletonRow title="Trending Series" />}>
          <MovieRow
            title="Trending Series"
            movies={trendingTV.slice(0, 15)}
            mediaType="tv"
            ranked
            exploreHref="/trending"
          />
        </Suspense>

        <Suspense fallback={<SkeletonRow title="Popular Movies" />}>
          <MovieRow title="Popular Movies" movies={popular.slice(0, 15)} mediaType="movie" />
        </Suspense>

        <Suspense fallback={<SkeletonRow title="Popular Shows" />}>
          <MovieRow title="Popular Shows" movies={popularTV.slice(0, 15)} mediaType="tv" />
        </Suspense>

        <Suspense fallback={<SkeletonRow title="Action Thrillers" />}>
          <MovieRow
            title="Action Thrillers"
            movies={action.slice(0, 15)}
            mediaType="movie"
            exploreHref="/genre/action"
            discoverPath="/discover/movie"
            filters={[
              { label: 'Popular', params: { with_genres: '28', sort_by: 'popularity.desc' } },
              { label: 'Rated', params: { with_genres: '28', sort_by: 'vote_average.desc', 'vote_count.gte': '300' } },
              { label: 'New', params: { with_genres: '28', sort_by: 'release_date.desc', 'vote_count.gte': '20' } },
            ]}
          />
        </Suspense>

        <Suspense fallback={<SkeletonRow title="Top Rated Movies" />}>
          <MovieRow title="Top Rated Movies" movies={topRated.slice(0, 15)} mediaType="movie" />
        </Suspense>

        <Suspense fallback={<SkeletonRow title="Top Rated Series" />}>
          <MovieRow title="Top Rated Series" movies={topRatedTV.slice(0, 15)} mediaType="tv" />
        </Suspense>

        <Suspense fallback={<SkeletonRow title="Sci-Fi Worlds" />}>
          <MovieRow
            title="Sci-Fi Worlds"
            movies={scifi.slice(0, 15)}
            mediaType="movie"
            exploreHref="/genre/science-fiction"
            discoverPath="/discover/movie"
            filters={[
              { label: 'Popular', params: { with_genres: '878', sort_by: 'popularity.desc' } },
              { label: 'Rated', params: { with_genres: '878', sort_by: 'vote_average.desc', 'vote_count.gte': '300' } },
              { label: 'New', params: { with_genres: '878', sort_by: 'release_date.desc', 'vote_count.gte': '20' } },
            ]}
          />
        </Suspense>

        <Suspense fallback={<SkeletonRow title="Now Playing" />}>
          <MovieRow title="Now Playing" movies={nowPlaying.slice(0, 15)} mediaType="movie" />
        </Suspense>
      </div>
    </main>
  )
}
