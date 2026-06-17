# Jen1 — Cinematic Movie Discovery Platform

A premium, immersive movie discovery and streaming experience powered by TMDB and Next.js 15.

## Stack

- **Framework**: Next.js 15 (App Router, Server Components, Streaming)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom cinematic design tokens
- **Data**: TMDB API v3
- **Video**: Proxied embed providers (vidsrc.to + fallbacks)
- **Deploy**: Vercel (zero-config)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
# Edit .env.local
TMDB_API_KEY=your_tmdb_api_key_here
VIDSRC_BASE=https://vidsrc.to/embed
```

Get a free TMDB API key at: https://www.themoviedb.org/settings/api

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push to GitHub
2. Import project at vercel.com
3. Add env vars: `TMDB_API_KEY`, `VIDSRC_BASE`
4. Deploy

## Project Structure

```
jen1/
├── app/
│   ├── favicon.ico             # Auto-detected by Next.js App Router
│   ├── layout.tsx              # Root layout, fonts, global providers
│   ├── page.tsx                # Home — hero + all rows (server component)
│   ├── globals.css             # Tailwind base + cinematic custom styles
│   └── api/
│       ├── tmdb/route.ts       # TMDB proxy (hides API key from client)
│       └── video/route.ts      # Video stream proxy with provider fallbacks
├── components/
│   ├── Navbar.tsx              # Fixed top nav with image logo + search
│   ├── SearchBar.tsx           # Real-time search with dropdown
│   ├── HeroBanner.tsx          # Auto-rotating featured hero
│   ├── MovieRow.tsx            # Horizontal scroll row
│   ├── MovieCard.tsx           # Poster card with hover effects
│   ├── SkeletonRow.tsx         # Loading skeleton for rows
│   ├── DetailModal.tsx         # Full metadata modal
│   ├── VideoPlayer.tsx         # Stream/trailer player with fallbacks
│   └── Providers.tsx           # Global overlay mounter
├── lib/
│   └── tmdb.ts                 # Typed TMDB API client with ISR caching
├── types/
│   └── tmdb.ts                 # TypeScript interfaces
└── public/
    ├── jen1-logo.png           # Brand logo (navbar + favicon source)
    ├── favicon.ico             # Generated from logo
    ├── apple-touch-icon.png    # iOS home screen icon
    └── og-image.png            # OpenGraph share image
```

## Roadmap (Scoped)

### In Scope — Next Build Phase

**Provider Expansion** (`app/api/video/route.ts`)
Add vidlink.pro, vidsrc.pro, 2embed.cc, videasy.net to the fallback array.
Zero architectural change, instant coverage boost.

**TV / Series Support**
New TMDB endpoints for trending TV, popular series.
Season/episode picker UI in DetailModal.
Pass `?type=tv&season=1&episode=1` to the video API route (already wired for it).

**Better Stream Error UX**
"Currently unavailable" state with friendly copy instead of a broken iframe.
Optional "notify me" placeholder (no backend needed yet — just UI).

**Performance: Row Caching**
Vercel KV (or simple in-memory ISR) for popular row data.
Reduces cold-start fetch time and TMDB rate-limit exposure.

### Medium Term

**Auth + Watchlist** (Clerk is the fastest path — one package, pre-built UI)
Watchlist stored in Vercel KV per user.
"Continue Watching" row on the home page.

**"More Like This"** row in DetailModal using TMDB `/movie/{id}/recommendations`.
Zero backend work — pure TMDB.

**Advanced Discovery**
Genre filter pages (`/genre/[id]`)
Year/rating/language filter bar
Infinite scroll (replace static row with paginated fetch)

**Native HLS Player** (hls.js)
Replaces iframe embed for sources that expose direct `.m3u8` links.
Enables quality switching, seek, subtitle tracks.

### Out of Scope (for now)

- Admin dashboard / manual curation
- PWA / offline support
- Ad integration or monetization tier
- Multi-language UI
- Analytics pipeline
- Separate scraper microservice (only worth it at scale)

## Keyboard Shortcuts

- `Esc` — Close modal or exit player
