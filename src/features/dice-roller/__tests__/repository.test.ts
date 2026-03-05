import { beforeEach, describe, expect, it } from 'vitest'

import { localStorageAdapter } from '@/features/core/storage'
import { diceRollerRepository, resetDiceRollerStateForTests } from '@/features/dice-roller/repository'
import type { DiceRoll } from '@/features/dice-roller/types'

const STORAGE_KEY = 'dnd-db.dice-roller.v1'

function makeRoll(index: number, campaignId = 'campaign-1'): DiceRoll {
  return {
    id: `roll-${index}`,
    campaignId,
    notation: '1d20',
    dice: 'd20',
    count: 1,
    results: [(index % 20) + 1],
    modifier: 0,
    total: (index % 20) + 1,
    isNatTwenty: index % 20 === 19,
    isNatOne: index % 20 === 0,
    rolledAt: new Date(2026, 0, 1, 0, index).toISOString(),
  }
}

describe('dice roller repository', () => {
  beforeEach(() => {
    resetDiceRollerStateForTests()
  })

  it('updates tray and rolling flags', () => {
    diceRollerRepository.setOpen(true)
    diceRollerRepository.setRolling(true)

    const state = diceRollerRepository.getState()
    expect(state.isOpen).toBe(true)
    expect(state.isRolling).toBe(true)
  })

  it('stores and limits roll history to 50 per campaign', () => {
    for (let index = 1; index <= 60; index += 1) {
      diceRollerRepository.addRoll(makeRoll(index))
    }

    const rolls = diceRollerRepository.getState().rollsByCampaign['campaign-1'] ?? []
    expect(rolls).toHaveLength(50)
    expect(rolls[0]?.id).toBe('roll-11')
    expect(rolls[49]?.id).toBe('roll-60')
  })

  it('persists only rollsByCampaign data', () => {
    diceRollerRepository.setOpen(true)
    diceRollerRepository.setRolling(true)
    diceRollerRepository.setPendingRoll({
      notation: '1d20',
      targetValues: [17],
      dice: 'd20',
      count: 1,
      modifier: 0,
    })
    diceRollerRepository.addRoll(makeRoll(1))

    const raw = localStorageAdapter.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw ?? '{}') as Record<string, unknown>

    expect(parsed['campaign-1']).toBeDefined()
    expect(parsed['isOpen']).toBeUndefined()
    expect(parsed['isRolling']).toBeUndefined()
    expect(parsed['pendingRoll']).toBeUndefined()
  })

  it('supports clearing rolls for a campaign', () => {
    diceRollerRepository.addRoll(makeRoll(1, 'campaign-1'))
    diceRollerRepository.addRoll(makeRoll(2, 'campaign-2'))

    diceRollerRepository.clearCampaignRolls('campaign-1')

    const state = diceRollerRepository.getState()
    expect(state.rollsByCampaign['campaign-1']).toBeUndefined()
    expect(state.rollsByCampaign['campaign-2']).toHaveLength(1)
  })
})
