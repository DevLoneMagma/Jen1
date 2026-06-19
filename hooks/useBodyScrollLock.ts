// hooks/useBodyScrollLock.ts
// Reference-counted document.body scroll lock. Multiple components can be
// "locked" at once (e.g. DetailModal open, then VideoPlayer opens on top of
// it) — the body only becomes scrollable again once every lock holder has
// released. A flat boolean lock here previously caused a bug: closing just
// the player while the modal stayed open reset overflow to '' on the
// player's unmount, even though the modal underneath still needed it
// locked, briefly leaving the page scrollable behind an open modal.

import { useEffect } from 'react'

let lockCount = 0

function acquire() {
  lockCount += 1
  if (lockCount === 1) document.body.style.overflow = 'hidden'
}

function release() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) document.body.style.overflow = ''
}

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    acquire()
    return () => release()
  }, [active])
}
