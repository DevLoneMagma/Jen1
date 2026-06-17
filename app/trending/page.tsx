// app/trending/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import TrendingGrid from '@/components/TrendingGrid'

export const metadata: Metadata = {
  title: 'Trending Now',
  description: 'The movies and shows everyone is watching this week.',
}

export default function TrendingPage() {
  return (
    <main className="min-h-screen bg-jen1-black">
      <Navbar />
      <div className="pt-20 pb-16 px-6 md:px-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-white/35 hover:text-white text-sm transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Home
        </Link>
        <h1 className="font-archivo font-black text-display-hero mb-8">
          Trending Now
        </h1>
        <TrendingGrid />
      </div>
    </main>
  )
}
