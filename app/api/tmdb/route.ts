// app/api/tmdb/route.ts

import { NextRequest, NextResponse } from 'next/server'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 })
  }
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const forward = new URLSearchParams(searchParams)
  forward.delete('path')
  forward.set('api_key', API_KEY)

  try {
    const res = await fetch(`${TMDB_BASE}${path}?${forward.toString()}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return NextResponse.json({ error: res.statusText }, { status: res.status })
    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch {
    return NextResponse.json({ error: 'TMDB fetch failed' }, { status: 500 })
  }
}
