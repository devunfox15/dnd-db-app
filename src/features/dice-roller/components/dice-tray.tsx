import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  buildDiceRoll,
  formatRollAnnouncement,
  generateTargetValues,
  prefersReducedMotion,
  toNotation,
} from '@/features/dice-roller/dice-logic'
import { DiceCanvas } from '@/features/dice-roller/components/dice-canvas'
import { DiceSelector } from '@/features/dice-roller/components/dice-selector'
import { NatTwentyOverlay } from '@/features/dice-roller/components/nat-twenty-overlay'
import { RollHistory } from '@/features/dice-roller/components/roll-history'
import { diceRollerRepository } from '@/features/dice-roller/repository'
import { playRollSound, playSettleSound } from '@/features/dice-roller/sound-manager'
import {
  useDiceTrayOpen,
  useIsRolling,
  usePendingRoll,
  useRollHistory,
} from '@/features/dice-roller/store'
import type { DieType } from '@/features/dice-roller/types'
import { useActiveCampaignId } from '@/features/core/store'

interface InFlightRoll {
  campaignId: string
  dieType: DieType
  count: number
  modifier: number
  targetValues: number[]
}

export function DiceTray() {
  const campaignId = useActiveCampaignId()
  const isOpen = useDiceTrayOpen()
  const isRolling = useIsRolling()
  const pendingRoll = usePendingRoll()
  const rollHistory = useRollHistory(campaignId)
  const [dieType, setDieType] = useState<DieType>('d20')
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const [natTwentyTriggerCount, setNatTwentyTriggerCount] = useState(0)
  const inFlightRollRef = useRef<InFlightRoll | null>(null)
  const settleTimeoutRef = useRef<number | null>(null)

  const clearSettleTimeout = useCallback(() => {
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current)
      settleTimeoutRef.current = null
    }
  }, [])

  const finalizeRoll = useCallback(() => {
    const inFlight = inFlightRollRef.current
    if (!inFlight) {
      return
    }

    const completedRoll = buildDiceRoll(
      {
        campaignId: inFlight.campaignId,
        dieType: inFlight.dieType,
        count: inFlight.count,
        modifier: inFlight.modifier,
      },
      inFlight.targetValues,
    )
    diceRollerRepository.addRoll(completedRoll)
    diceRollerRepository.setRolling(false)
    diceRollerRepository.setPendingRoll(null)
    playSettleSound()
    setAnnouncement(formatRollAnnouncement(completedRoll))
    if (completedRoll.isNatTwenty) {
      setNatTwentyTriggerCount((value) => value + 1)
    }

    inFlightRollRef.current = null
    clearSettleTimeout()
  }, [clearSettleTimeout])

  const handleRoll = useCallback(() => {
    if (!campaignId || isRolling) {
      return
    }

    const targetValues = generateTargetValues(dieType, count)
    inFlightRollRef.current = {
      campaignId,
      dieType,
      count,
      modifier,
      targetValues,
    }

    diceRollerRepository.setRolling(true)

    if (prefersReducedMotion()) {
      finalizeRoll()
      return
    }

    diceRollerRepository.setPendingRoll({
      notation: toNotation(dieType, count, modifier),
      targetValues,
      dice: dieType,
      count,
      modifier,
    })
    playRollSound()
    clearSettleTimeout()
    settleTimeoutRef.current = window.setTimeout(() => {
      finalizeRoll()
    }, 8000)
  }, [campaignId, clearSettleTimeout, count, dieType, finalizeRoll, isRolling, modifier])

  useEffect(() => {
    return () => {
      clearSettleTimeout()
      inFlightRollRef.current = null
    }
  }, [clearSettleTimeout])

  const lastRoll = rollHistory[0] ?? null
  const canRoll = Boolean(campaignId) && !isRolling

  return (
    <Sheet open={isOpen} onOpenChange={(open) => diceRollerRepository.setOpen(open)}>
      <SheetContent side="bottom" className="h-[90vh] max-h-[90vh]">
        <SheetHeader className="pb-3">
          <SheetTitle>Dice Roller</SheetTitle>
          <SheetDescription>3D tray for campaign-scoped rolls.</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 pb-6">
          <DiceSelector
            selectedDie={dieType}
            count={count}
            modifier={modifier}
            onDieChange={setDieType}
            onCountChange={setCount}
            onModifierChange={setModifier}
          />

          <div className="relative">
            <DiceCanvas
              pendingRoll={pendingRoll}
              onPendingRollConsumed={() => diceRollerRepository.setPendingRoll(null)}
              onRollAnimationComplete={finalizeRoll}
            />
            <NatTwentyOverlay triggerCount={natTwentyTriggerCount} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-muted/25 p-3">
            <div className="min-w-0">
              <p className="text-xs font-medium">
                {lastRoll
                  ? `Result ${lastRoll.results.join(', ')} | Total ${lastRoll.total}`
                  : 'No result yet'}
              </p>
              <p className="text-[0.625rem] text-muted-foreground">
                {campaignId ? `Campaign ${campaignId}` : 'Open a campaign to roll dice'}
              </p>
            </div>
            <Button type="button" disabled={!canRoll} onClick={handleRoll}>
              {isRolling ? 'Rolling...' : `Roll ${toNotation(dieType, count, modifier)}`}
            </Button>
          </div>

          <RollHistory rolls={rollHistory} />
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
