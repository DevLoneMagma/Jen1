// app/tv/[id]/page.tsx

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getTVDetails, getTVVideos, getTVCredits, getTVRecommendations,
  getTitle, getReleaseYear, backdropUrl,
} from '@/lib/tmdb'
import DetailPage from '@/components/DetailPage'
import Navbar from '@/components/Navbar'

interface Props {
  params: Promise<{ id: string }>
}

async function getShow(id: number) {
  try {
    const [details, videos, credits, recommendations] = await Promise.all([
      getTVDetails(id),
      getTVVideos(id),
      getTVCredits(id),
      getTVRecommendations(id),
    ])
    return { details, videos, credits, recommendations }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getShow(Number(id))
  if (!data) return { title: 'Series Not Found' }

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
      type: 'video.tv_show',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function TVPage({ params }: Props) {
  const { id } = await params
  const data = await getShow(Number(id))
  if (!data) notFound()

  const { details, videos, credits, recommendations } = data

  return (
    <main className="bg-jen1-black">
      <Navbar />
      <DetailPage
        item={details}
        type="tv"
        videos={videos}
        credits={credits}
        recommendations={recommendations}
      />
    </main>
  )
}
