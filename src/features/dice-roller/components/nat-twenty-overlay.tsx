import { useEffect, useState } from 'react'

import { prefersReducedMotion } from '@/features/dice-roller/dice-logic'
import { cn } from '@/lib/utils'

interface NatTwentyOverlayProps {
  triggerCount: number
}

export function NatTwentyOverlay({ triggerCount }: NatTwentyOverlayProps) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (triggerCount === 0 || prefersReducedMotion()) {
      return
    }

    setIsActive(true)
    const timeoutId = window.setTimeout(() => setIsActive(false), 1200)

    void import('canvas-confetti').then((module) => {
      const launch = module.default
      void launch({
        particleCount: 130,
        spread: 90,
        startVelocity: 45,
        scalar: 1.1,
        origin: { y: 0.65 },
        zIndex: 70,
      })
    })

    return () => window.clearTimeout(timeoutId)
  }, [triggerCount])

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 rounded border-2 border-transparent transition-all duration-300',
        isActive && 'border-amber-400/60 shadow-[0_0_30px_rgba(251,191,36,0.55)]',
      )}
    />
  )
}
