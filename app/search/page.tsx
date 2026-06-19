// app/search/page.tsx

import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import SearchResults from '@/components/SearchResults'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Search Results` : 'Search',
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  return (
    <main className="min-h-screen bg-jen1-black">
      <Navbar />
      <SearchResults query={q ?? ''} />
    </main>
  )
}
