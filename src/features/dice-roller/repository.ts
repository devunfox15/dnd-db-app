import { localStorageAdapter } from '@/features/core/storage'
import type { DiceRoll, DiceRollerState, PendingRoll } from '@/features/dice-roller/types'

const STORAGE_KEY = 'dnd-db.dice-roller.v1'
const ROLL_LIMIT = 50

const listeners = new Set<() => void>()

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sanitizeRoll(value: unknown): DiceRoll | null {
  if (!isObject(value)) {
    return null
  }

  const id = typeof value.id === 'string' ? value.id : ''
  const campaignId = typeof value.campaignId === 'string' ? value.campaignId : ''
  const notation = typeof value.notation === 'string' ? value.notation : ''
  const dice = value.dice
  const count = typeof value.count === 'number' && Number.isFinite(value.count) ? Math.floor(value.count) : 1
  const results = Array.isArray(value.results)
    ? value.results.filter((item): item is number => typeof item === 'number' && Number.isFinite(item)).map((item) => Math.floor(item)).slice(0, 8)
    : []
  const modifier = typeof value.modifier === 'number' && Number.isFinite(value.modifier) ? Math.floor(value.modifier) : 0
  const total = typeof value.total === 'number' && Number.isFinite(value.total) ? Math.floor(value.total) : results.reduce((sum, item) => sum + item, 0) + modifier
  const rolledAt = typeof value.rolledAt === 'string' ? value.rolledAt : ''

  if (!id || !campaignId || !notation || !rolledAt || results.length === 0) {
    return null
  }

  if (dice !== 'd4' && dice !== 'd6' && dice !== 'd8' && dice !== 'd10' && dice !== 'd12' && dice !== 'd20') {
    return null
  }

  return {
    id,
    campaignId,
    notation,
    dice,
    count: Math.max(1, Math.min(4, count)),
    results,
    modifier,
    total,
    isNatTwenty: value.isNatTwenty === true,
    isNatOne: value.isNatOne === true,
    rolledAt,
    label: typeof value.label === 'string' ? value.label : undefined,
  }
}

function sanitizePersisted(value: unknown): Record<string, DiceRoll[]> {
  if (!isObject(value)) {
    return {}
  }

  const next: Record<string, DiceRoll[]> = {}

  for (const [campaignId, maybeRolls] of Object.entries(value)) {
    if (!Array.isArray(maybeRolls)) {
      continue
    }

    const rolls = maybeRolls
      .map((roll) => sanitizeRoll(roll))
      .filter((roll): roll is DiceRoll => Boolean(roll))
      .slice(-ROLL_LIMIT)

    if (rolls.length > 0) {
      next[campaignId] = rolls
    }
  }

  return next
}

function loadPersistedState(): Record<string, DiceRoll[]> {
  const raw = localStorageAdapter.getItem(STORAGE_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return sanitizePersisted(parsed)
  } catch {
    return {}
  }
}

function persistRollsByCampaign(rollsByCampaign: Record<string, DiceRoll[]>) {
  localStorageAdapter.setItem(STORAGE_KEY, JSON.stringify(sanitizePersisted(rollsByCampaign)))
}

function createInitialState(): DiceRollerState {
  return {
    isOpen: false,
    isRolling: false,
    pendingRoll: null,
    rollsByCampaign: loadPersistedState(),
  }
}

let diceRollerState: DiceRollerState = createInitialState()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export const diceRollerRepository = {
  getState() {
    return diceRollerState
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  setOpen(isOpen: boolean) {
    if (diceRollerState.isOpen === isOpen) {
      return
    }

    diceRollerState = {
      ...diceRollerState,
      isOpen,
    }
    emitChange()
  },
  setRolling(isRolling: boolean) {
    if (diceRollerState.isRolling === isRolling) {
      return
    }

    diceRollerState = {
      ...diceRollerState,
      isRolling,
    }
    emitChange()
  },
  setPendingRoll(pendingRoll: PendingRoll | null) {
    diceRollerState = {
      ...diceRollerState,
      pendingRoll,
    }
    emitChange()
  },
  addRoll(roll: DiceRoll) {
    const currentRolls = diceRollerState.rollsByCampaign[roll.campaignId] ?? []
    const nextCampaignRolls = [...currentRolls, roll].slice(-ROLL_LIMIT)
    const nextRollsByCampaign = {
      ...diceRollerState.rollsByCampaign,
      [roll.campaignId]: nextCampaignRolls,
    }

    diceRollerState = {
      ...diceRollerState,
      rollsByCampaign: nextRollsByCampaign,
    }

    persistRollsByCampaign(nextRollsByCampaign)
    emitChange()
  },
  clearCampaignRolls(campaignId: string) {
    if (!diceRollerState.rollsByCampaign[campaignId]) {
      return
    }

    const nextRollsByCampaign = { ...diceRollerState.rollsByCampaign }
    delete nextRollsByCampaign[campaignId]

    diceRollerState = {
      ...diceRollerState,
      rollsByCampaign: nextRollsByCampaign,
    }

    persistRollsByCampaign(nextRollsByCampaign)
    emitChange()
  },
}

export function resetDiceRollerStateForTests() {
  localStorageAdapter.removeItem(STORAGE_KEY)
  diceRollerState = createInitialState()
  emitChange()
}
