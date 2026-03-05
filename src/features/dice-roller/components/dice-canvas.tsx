import { useEffect, useId, useRef, useState } from 'react'

import type { PendingRoll } from '@/features/dice-roller/types'

type DiceBoxLike = {
  init: () => Promise<unknown>
  roll: (notation: string, options?: Record<string, unknown>) => Promise<unknown>
  clear?: () => void
  onRollComplete?: (results: unknown) => void
}

interface DiceCanvasProps {
  pendingRoll: PendingRoll | null
  onPendingRollConsumed: () => void
  onRollAnimationComplete: () => void
}

function useDiceEngine(
  containerSelector: string,
  pendingRoll: PendingRoll | null,
  onPendingRollConsumed: () => void,
  onRollAnimationComplete: () => void,
) {
  const boxRef = useRef<DiceBoxLike | null>(null)
  const isInitialized = useRef(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (isInitialized.current || typeof window === 'undefined') {
      return
    }

    isInitialized.current = true
    let isMounted = true

    void import('@3d-dice/dice-box')
      .then(async (module) => {
        const DiceBox = module.default as new (
          selector: string,
          options: Record<string, unknown>,
        ) => DiceBoxLike
        const box = new DiceBox(containerSelector, {
          assetPath: '/dice-box/',
          offscreen: true,
          theme: 'default',
          scale: 7,
          gravity: 2.8,
        })
        await box.init()

        if (!isMounted) {
          return
        }

        box.onRollComplete = () => onRollAnimationComplete()
        boxRef.current = box
        setIsReady(true)
      })
      .catch(() => {
        setIsReady(false)
      })

    return () => {
      isMounted = false
      boxRef.current = null
      isInitialized.current = false
      setIsReady(false)
    }
  }, [containerSelector, onRollAnimationComplete])

  useEffect(() => {
    if (!pendingRoll || !boxRef.current) {
      return
    }

    void boxRef.current
      .roll(pendingRoll.notation, { targetValues: pendingRoll.targetValues })
      .catch(() => {
        onRollAnimationComplete()
      })
      .finally(() => {
        onPendingRollConsumed()
      })
  }, [onPendingRollConsumed, onRollAnimationComplete, pendingRoll])

  return { isReady }
}

export function DiceCanvas({
  pendingRoll,
  onPendingRollConsumed,
  onRollAnimationComplete,
}: DiceCanvasProps) {
  const reactId = useId()
  const containerId = `dice-canvas-${reactId.replace(/:/g, '-')}`
  const { isReady } = useDiceEngine(
    `#${containerId}`,
    pendingRoll,
    onPendingRollConsumed,
    onRollAnimationComplete,
  )

  return (
    <div
      id={containerId}
      role="img"
      aria-label="3D dice rolling area"
      className="relative h-[320px] overflow-hidden rounded border bg-gradient-to-b from-slate-200/35 via-slate-300/25 to-slate-500/10 dark:from-slate-800/80 dark:via-slate-900/60 dark:to-black/70"
    >
      {!isReady ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Loading dice engine...
        </div>
      ) : null}
    </div>
  )
}
