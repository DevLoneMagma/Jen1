// lib/modalCache.ts
// A module-level Map persists across component instances (but not across
// full page reloads), so a card's 300ms hover-prefetch can warm the cache
// and DetailModal can read it back out when the user actually clicks —
// zero perceived latency on the common "hover, then click" path.
//
// Each entry resolves to the four parallel fetches DetailModal needs:
// details, videos, credits, recommendations — exactly mirroring what
// openItem() in DetailModal.tsx already requests, so a cache hit can
// replace those fetches outright instead of just deduping one of them.

export interface CachedModalData {
  details: any
  videos: any
  credits: any
  recommendations: any
}

type CacheKey = `${'movie' | 'tv'}:${number}`

const cache = new Map<CacheKey, Promise<CachedModalData>>()

// Entries older than this are treated as stale and re-fetched — guards
// against a user hovering, waiting several minutes, then clicking on
// data that may no longer be fresh (TMDB ratings/dates can change).
const MAX_AGE_MS = 5 * 60 * 1000
const timestamps = new Map<CacheKey, number>()

function key(id: number, type: 'movie' | 'tv'): CacheKey {
  return `${type}:${id}`
}

function fetchModalData(id: number, type: 'movie' | 'tv'): Promise<CachedModalData> {
  const base = `/api/tmdb?path=/${type}/${id}`
  return Promise.all([
    fetch(base).then(r => r.json()),
    fetch(`${base}/videos`).then(r => r.json()),
    fetch(`${base}/credits`).then(r => r.json()),
    fetch(`${base}/recommendations`).then(r => r.json()),
  ]).then(([details, videos, credits, recommendations]) => ({ details, videos, credits, recommendations }))
}

// Called on card hover (after the 300ms threshold). Fire-and-forget —
// callers don't need to await this; it just warms the cache.
export function prefetchModalData(id: number, type: 'movie' | 'tv') {
  const k = key(id, type)
  const age = Date.now() - (timestamps.get(k) ?? 0)
  if (cache.has(k) && age < MAX_AGE_MS) return
  timestamps.set(k, Date.now())
  const promise = fetchModalData(id, type)
  cache.set(k, promise)
  // If the fetch fails, drop it from the cache so a later click falls
  // back to a fresh fetch instead of permanently caching a rejection.
  promise.catch(() => { cache.delete(k); timestamps.delete(k) })
}

// Called by DetailModal on open. Returns the in-flight/cached promise if
// fresh, otherwise kicks off (and caches) a new fetch — so the modal's
// own fetch logic stays a single code path regardless of cache state.
export function getModalData(id: number, type: 'movie' | 'tv'): Promise<CachedModalData> {
  const k = key(id, type)
  const age = Date.now() - (timestamps.get(k) ?? 0)
  if (cache.has(k) && age < MAX_AGE_MS) return cache.get(k)!
  timestamps.set(k, Date.now())
  const promise = fetchModalData(id, type)
  cache.set(k, promise)
  promise.catch(() => { cache.delete(k); timestamps.delete(k) })
  return promise
}
