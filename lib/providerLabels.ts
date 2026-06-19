// lib/providerLabels.ts
// Human-readable labels for streaming providers, keyed by hostname.
// Shared between app/api/video/route.ts (server) and VideoPlayer.tsx
// (client source-picker UI) so the two never drift out of sync.

const PROVIDER_LABELS: Record<string, string> = {
  'vidsrc.to': 'VidSrc',
  'vidsrc.pro': 'VidSrc Pro',
  'vidlink.pro': 'VidLink',
  'embed.su': 'Embed.su',
  'videasy.net': 'Videasy',
  '2embed.cc': '2Embed',
  'multiembed.mov': 'MultiEmbed',
}

export function labelForUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return PROVIDER_LABELS[host] ?? host
  } catch {
    return 'Server'
  }
}
