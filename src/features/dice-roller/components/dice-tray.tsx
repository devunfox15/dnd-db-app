import { useCallback, useEffect, useRef, useState } from 'react'
import { Dices } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { diceRollerRepository } from '@/features/dice-roller/repository'
import {
  playRollSound,
  playSettleSound,
} from '@/features/dice-roller/sound-manager'
import {
  useDiceTrayOpen,
  useIsRolling,
  usePendingRoll,
  useRollHistory,
} from '@/features/dice-roller/store'
import type { DiceRoll, DieType } from '@/features/dice-roller/types'
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
  const [dieType, setDieType] = useState<DieType | null>(null)
  const [count, setCount] = useState(0)
  const modifier = 0
  const [announcement, setAnnouncement] = useState('')
  const [natTwentyTriggerCount, setNatTwentyTriggerCount] = useState(0)
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null)
  const [resultVisible, setResultVisible] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const inFlightRollRef = useRef<InFlightRoll | null>(null)
  const settleTimeoutRef = useRef<number | null>(null)
  const resultTimeoutRef = useRef<number | null>(null)

  const clearSettleTimeout = useCallback(() => {
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current)
      settleTimeoutRef.current = null
    }
  }, [])

  const finalizeRoll = useCallback((actualValues?: number[]) => {
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
      actualValues && actualValues.length > 0
        ? actualValues
        : inFlight.targetValues,
    )
    diceRollerRepository.addRoll(completedRoll)
    diceRollerRepository.setRolling(false)
    diceRollerRepository.setPendingRoll(null)
    playSettleSound()
    setAnnouncement(formatRollAnnouncement(completedRoll))
    if (completedRoll.isNatTwenty) {
      setNatTwentyTriggerCount((value) => value + 1)
    }

    setLastRoll(completedRoll)
    setResultVisible(true)
    if (resultTimeoutRef.current !== null) {
      window.clearTimeout(resultTimeoutRef.current)
    }
    resultTimeoutRef.current = window.setTimeout(() => {
      setResultVisible(false)
      resultTimeoutRef.current = window.setTimeout(() => {
        setLastRoll(null)
        resultTimeoutRef.current = null
      }, 300)
    }, 6000)

    inFlightRollRef.current = null
    clearSettleTimeout()
  }, [clearSettleTimeout])

  const handleRoll = useCallback(() => {
    if (!campaignId || isRolling || !dieType || count < 1) {
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
  }, [
    campaignId,
    clearSettleTimeout,
    count,
    dieType,
    finalizeRoll,
    isRolling,
    modifier,
  ])

  useEffect(() => {
    return () => {
      clearSettleTimeout()
      inFlightRollRef.current = null
      if (resultTimeoutRef.current !== null) {
        window.clearTimeout(resultTimeoutRef.current)
      }
    }
  }, [clearSettleTimeout])

  const canRoll =
    Boolean(campaignId) && !isRolling && Boolean(dieType) && count > 0
  const showOverlay = isOpen || isRolling || pendingRoll !== null

  const handleDieClick = useCallback(
    (die: DieType) => {
      if (dieType === die) {
        setCount((value) => Math.min(9, value + 1))
        return
      }

      setDieType(die)
      setCount(1)
    },
    [dieType],
  )

  const handleReset = useCallback(() => {
    setDieType(null)
    setCount(0)
  }, [])

  return (
    <>
      {showOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-30">
          <div className="absolute inset-0 bg-transparent">
            <DiceCanvas
              pendingRoll={pendingRoll}
              onPendingRollConsumed={() =>
                diceRollerRepository.setPendingRoll(null)
              }
              onRollAnimationComplete={finalizeRoll}
            />
            <NatTwentyOverlay triggerCount={natTwentyTriggerCount} />
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto absolute left-6 bottom-6 z-40 flex flex-col items-start gap-2">
        {isOpen ? (
          <DiceSelector
            selectedDie={dieType}
            count={count}
            onDieClick={handleDieClick}
            onReset={handleReset}
            onRoll={handleRoll}
            canRoll={canRoll}
            isRolling={isRolling}
          />
        ) : null}
        <Button
          type="button"
          size="icon-lg"
          className="rounded-full shadow-lg "
          aria-label="Toggle dice popover"
          aria-pressed={isOpen}
          onClick={() => diceRollerRepository.setOpen(!isOpen)}
        >
          <Dices />
        </Button>
      </div>

      {rollHistory.length > 0 || lastRoll ? (
        <div className="pointer-events-auto absolute right-6 bottom-6 z-40 flex flex-col items-end gap-1.5">
          {logOpen ? (
            <div className="w-64 max-h-72 overflow-y-auto rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg flex flex-col">
              <p className="sticky top-0 bg-background/95 px-3 pt-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                Roll Log
              </p>
              <div className="flex flex-col divide-y divide-border">
                {rollHistory.map((roll) => (
                  <div key={roll.id} className="flex items-center justify-between px-3 py-2 gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-muted-foreground font-mono">
                        {roll.notation}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(roll.rolledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {roll.isNatTwenty ? (
                        <span className="text-[10px] font-semibold text-yellow-400 uppercase">Nat 20</span>
                      ) : roll.isNatOne ? (
                        <span className="text-[10px] font-semibold text-red-400 uppercase">Nat 1</span>
                      ) : null}
                      <span className={`text-base font-bold tabular-nums ${roll.isNatTwenty ? 'text-yellow-300' : roll.isNatOne ? 'text-red-300' : 'text-foreground'}`}>
                        {roll.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {lastRoll ? (
            <div className={`transition-opacity duration-300 ${resultVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div
                className={`rounded-xl border shadow-lg p-4 min-w-32 text-center backdrop-blur-sm ${lastRoll.isNatTwenty ? 'border-yellow-400/60 bg-yellow-950/80' : lastRoll.isNatOne ? 'border-red-400/60 bg-red-950/80' : 'border-border bg-background/90'}`}
              >
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                  {lastRoll.notation}
                </p>
                {lastRoll.results.length > 1 ? (
                  <div className="flex flex-wrap gap-1 justify-center mb-2">
                    {lastRoll.results.map((value, index) => (
                      <span
                        key={index}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-mono font-semibold"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p
                  className={`text-3xl font-bold tabular-nums leading-none ${lastRoll.isNatTwenty ? 'text-yellow-300' : lastRoll.isNatOne ? 'text-red-300' : 'text-foreground'}`}
                >
                  {lastRoll.total}
                </p>
                {lastRoll.isNatTwenty ? (
                  <p className="mt-1.5 text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                    Nat 20!
                  </p>
                ) : lastRoll.isNatOne ? (
                  <p className="mt-1.5 text-xs font-semibold text-red-400 uppercase tracking-wider">
                    Nat 1
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setLogOpen((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            {logOpen ? 'Hide log' : 'Show log'}
          </button>
        </div>
      ) : null}

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </>
  )
}
