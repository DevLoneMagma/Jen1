'use client'
// components/Providers.tsx
import DetailModal from './DetailModal'
import KeyboardHelp from './KeyboardHelp'
import WatchTracker from './WatchTracker'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DetailModal />
      <KeyboardHelp />
      <WatchTracker />
    </>
  )
}
