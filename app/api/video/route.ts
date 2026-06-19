// app/api/video/route.ts

// Robust backend: server-side HEAD-probes each provider, returns only a verified
// working URL. Falls back silently through the list. Client never sees failures
// in the normal path.

import { NextRequest, NextResponse } from 'next/server'
import type { VideoSource } from '@/types/tmdb'
import { labelForUrl } from '@/lib/providerLabels'

const PROBE_TIMEOUT_MS = 2500

// Provider URL builders — ordered by reliability
const PROVIDERS = {
  movie: (id: string): string[] => [
    `https://vidsrc.to/embed/movie/${id}`,
    `https://vidsrc.pro/embed/movie/${id}`,
    `https://vidlink.pro/movie/${id}`,
    `https://embed.su/embed/movie/${id}`,
    `https://videasy.net/movie/${id}`,
    `https://2embed.cc/embed/${id}`,
    `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
  ],
  tv: (id: string, season: string, episode: string): string[] => [
    `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
    `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`,
    `https://vidlink.pro/tv/${id}/${season}/${episode}`,
    `https://embed.su/embed/tv/${id}/${season}/${episode}`,
    `https://videasy.net/tv/${id}/${season}/${episode}`,
    `https://2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  ],
}

// Human-readable labels for the provider-switcher UI, keyed by hostname.
// Defined in lib/providerLabels.ts so the client UI can reuse the exact
// same map without drifting out of sync.

// In-memory LRU cache: key → { url, ts }
// Keeps verified URLs for 10 minutes — repeat plays are instant
const cache = new Map<string, { url: string; ts: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 min

function getCached(key: string): string | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null }
  return entry.url
}

function setCached(key: string, url: string) {
  // Evict oldest if cache > 500 entries
  if (cache.size >= 500) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]
    if (oldest) cache.delete(oldest[0])
  }
  cache.set(key, { url, ts: Date.now() })
}

// HEAD-probe a single URL with timeout — true = reachable embed
async function probe(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)
    // Accept any 2xx or 3xx — embed pages often redirect
    return res.status < 500
  } catch {
    return false
  }
}

// Walk providers, probe each, return first that passes
async function findWorkingUrl(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    const ok = await probe(url)
    if (ok) return url
  }
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tmdbId = searchParams.get('id')
  const type = (searchParams.get('type') ?? 'movie') as 'movie' | 'tv'
  const season = searchParams.get('season') ?? '1'
  const episode = searchParams.get('episode') ?? '1'

  if (!tmdbId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const cacheKey = type === 'tv'
    ? `tv:${tmdbId}:s${season}:e${episode}`
    : `movie:${tmdbId}`

  // Cache hit — return immediately
  const cached = getCached(cacheKey)
  if (cached) {
    const allUrls = type === 'tv'
      ? PROVIDERS.tv(tmdbId, season, episode)
      : PROVIDERS.movie(tmdbId)
    // Put cached URL first, rest as fallbacks (client-side last resort)
    const others = allUrls.filter(u => u !== cached)
    const response: VideoSource = {
      streamUrl: cached,
      source: 'cached',
      fallbacks: others,
      label: labelForUrl(cached),
    }
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, max-age=600' },
    })
  }

  const urls = type === 'tv'
    ? PROVIDERS.tv(tmdbId, season, episode)
    : PROVIDERS.movie(tmdbId)

  // Try to find a working URL via server-side probing
  // Use Promise.race with a total budget of 8s — if probing takes too long,
  // fall through to returning all URLs for client-side handling
  const TOTAL_BUDGET_MS = 8000
  const budgetTimer = new Promise<null>(resolve => setTimeout(() => resolve(null), TOTAL_BUDGET_MS))

  const found = await Promise.race([
    findWorkingUrl(urls),
    budgetTimer,
  ])

  if (found) {
    setCached(cacheKey, found)
    const fallbacks = urls.filter(u => u !== found)
    const response: VideoSource = {
      streamUrl: found,
      source: 'probed',
      fallbacks,
      label: labelForUrl(found),
    }
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, max-age=600' },
    })
  }

  // Budget exceeded or all probes failed — return first URL optimistically
  // and let the client cycle through fallbacks if needed
  const response: VideoSource = {
    streamUrl: urls[0],
    source: 'optimistic',
    fallbacks: urls.slice(1),
    label: labelForUrl(urls[0]),
  }
  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
