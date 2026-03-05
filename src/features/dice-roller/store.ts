import { useSyncExternalStore } from 'react'

import { diceRollerRepository } from '@/features/dice-roller/repository'
import type { DiceRoll, PendingRoll } from '@/features/dice-roller/types'

export function useDiceRollerState() {
  return useSyncExternalStore(
    diceRollerRepository.subscribe,
    diceRollerRepository.getState,
    diceRollerRepository.getState,
  )
}

export function useDiceTrayOpen(): boolean {
  return useDiceRollerState().isOpen
}

export function useIsRolling(): boolean {
  return useDiceRollerState().isRolling
}

export function usePendingRoll(): PendingRoll | null {
  return useDiceRollerState().pendingRoll
}

export function useRollHistory(campaignId: string | null): DiceRoll[] {
  const state = useDiceRollerState()
  if (!campaignId) {
    return []
  }

  const campaignRolls = state.rollsByCampaign[campaignId] ?? []
  return [...campaignRolls].sort((a, b) => b.rolledAt.localeCompare(a.rolledAt))
}
