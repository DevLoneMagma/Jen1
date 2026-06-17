// app/movie/[id]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getMovieDetails, getMovieVideos, getMovieCredits, getMovieRecommendations,
  getTitle, getReleaseYear, backdropUrl,
} from '@/lib/tmdb'
import DetailPage from '@/components/DetailPage'
import Navbar from '@/components/Navbar'

interface Props {
  params: Promise<{ id: string }>
}

async function getMovie(id: number) {
  try {
    const [details, videos, credits, recommendations] = await Promise.all([
      getMovieDetails(id),
      getMovieVideos(id),
      getMovieCredits(id),
      getMovieRecommendations(id),
    ])
    return { details, videos, credits, recommendations }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getMovie(Number(id))
  if (!data) return { title: 'Movie Not Found' }

  const { details } = data
  const title = `${getTitle(details)} (${getReleaseYear(details)})`
  const description = details.overview || `Watch ${getTitle(details)} on Jen1.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: details.backdrop_path ? [{ url: backdropUrl(details.backdrop_path, 'original'), width: 1280, height: 720 }] : undefined,
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function MoviePage({ params }: Props) {
  const { id } = await params
  const data = await getMovie(Number(id))
  if (!data) notFound()

  const { details, videos, credits, recommendations } = data

  return (
    <main className="bg-jen1-black">
      <Navbar />
      <DetailPage
        item={details}
        type="movie"
        videos={videos}
        credits={credits}
        recommendations={recommendations}
      />
    </main>
  )
}
