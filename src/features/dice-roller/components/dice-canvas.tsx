import { useEffect, useId, useRef, useState } from 'react'
import type { DiceBoxConstructor, DiceBoxInstance } from '@3d-dice/dice-box'
import type { PendingRoll } from '@/features/dice-roller/types'

interface DiceRollGroup {
  rolls?: Array<{ value: number; valid?: boolean }>
}

export const DICE_BOX_THEME = 'default'
export const DICE_BOX_THEME_COLOR = '#000000'
export const DICE_BOX_SCALE = 18
export const DICE_CANVAS_HEIGHT_CLASS = 'h-full w-full'
export const DICE_BOX_THROW_FORCE = 2.8
export const DICE_BOX_STARTING_HEIGHT = 3.5
export const DICE_BOX_SIZE = 12
export const DICE_BOX_RESTITUTION = 0.5

interface DiceCanvasProps {
  pendingRoll: PendingRoll | null
  onPendingRollConsumed: () => void
  onRollAnimationComplete: (values: number[]) => void
}

function useDiceEngine(
  containerSelector: string,
  pendingRoll: PendingRoll | null,
  onPendingRollConsumed: () => void,
  onRollAnimationComplete: (values: number[]) => void,
) {
  const boxRef = useRef<DiceBoxInstance | null>(null)
  const isInitialized = useRef(false)
  const [isReady, setIsReady] = useState(false)
  // Stable ref so the init effect never re-runs when the callback changes identity
  const onRollAnimationCompleteRef = useRef(onRollAnimationComplete)
  onRollAnimationCompleteRef.current = onRollAnimationComplete

  useEffect(() => {
    if (isInitialized.current || typeof window === 'undefined') {
      return
    }

    isInitialized.current = true
    let isMounted = true

    void import('@3d-dice/dice-box')
      .then(async (module) => {
        const DiceBox = module.default as DiceBoxConstructor
        const box = new DiceBox(containerSelector, {
          assetPath: '/dice-box/',
          offscreen: true,
          theme: DICE_BOX_THEME,
          themeColor: DICE_BOX_THEME_COLOR,
          scale: DICE_BOX_SCALE,
          throwForce: DICE_BOX_THROW_FORCE,
          startingHeight: DICE_BOX_STARTING_HEIGHT,
          size: DICE_BOX_SIZE,
          gravity: 2.8,
          restitution: DICE_BOX_RESTITUTION,
        })

        // dice-box creates a <canvas> with no size — browser defaults to 300×150.
        // Set the HTML width/height attributes to match the container so the
        // OffscreenCanvas gets the correct rendering buffer dimensions.
        const container = document.querySelector(containerSelector)
        const diceCanvas =
          container?.querySelector<HTMLCanvasElement>('.dice-box-canvas')
        if (diceCanvas && container) {
          diceCanvas.width = container.clientWidth
          diceCanvas.height = container.clientHeight
        }

        await box.init()

        if (!isMounted) {
          return
        }

        box.onRollComplete = (results) => {
          const values = (results as unknown as DiceRollGroup[]).flatMap(
            (group) =>
              (group.rolls ?? [])
                .filter((r) => r.valid !== false)
                .map((r) => r.value),
          )
          onRollAnimationCompleteRef.current(values)
        }
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
  }, [containerSelector])

  useEffect(() => {
    if (!pendingRoll || !boxRef.current) {
      return
    }

    void boxRef.current
      .roll(pendingRoll.notation, { targetValues: pendingRoll.targetValues })
      .catch(() => {
        onRollAnimationCompleteRef.current([])
      })
      .finally(() => {
        onPendingRollConsumed()
      })
  }, [onPendingRollConsumed, pendingRoll])

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
      className={`${DICE_CANVAS_HEIGHT_CLASS} overflow-hidden `}
    >
      {!isReady ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground"></div>
      ) : null}
    </div>
  )
}
