import type { DiceRoll, DieType } from '@/features/dice-roller/types'

const dieSidesByType: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
}

export interface ParsedNotation {
  dieType: DieType
  count: number
  modifier: number
}

export interface BuildRollInput {
  campaignId: string
  dieType: DieType
  count: number
  modifier: number
  label?: string
}

export interface RollPreview {
  notation: string
  results: number[]
  total: number
  isNatTwenty: boolean
  isNatOne: boolean
}

function normalizeCount(count: number): number {
  return Math.min(4, Math.max(1, Math.floor(count)))
}

function normalizeModifier(modifier: number): number {
  if (!Number.isFinite(modifier)) {
    return 0
  }

  return Math.max(-99, Math.min(99, Math.floor(modifier)))
}

function isDieType(value: string): value is DieType {
  return value === 'd4' || value === 'd6' || value === 'd8' || value === 'd10' || value === 'd12' || value === 'd20'
}

export function parseNotation(notation: string): ParsedNotation {
  const match = notation.trim().match(/^(\d+)(d4|d6|d8|d10|d12|d20)([+-]\d+)?$/i)
  if (!match) {
    throw new Error(`Invalid notation: ${notation}`)
  }

  const count = Number.parseInt(match[1], 10)
  const dieType = match[2]?.toLowerCase() ?? ''
  const modifier = match[3] ? Number.parseInt(match[3], 10) : 0

  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Invalid dice count in notation: ${notation}`)
  }

  if (!isDieType(dieType)) {
    throw new Error(`Invalid die type in notation: ${notation}`)
  }

  return {
    dieType,
    count: normalizeCount(count),
    modifier: normalizeModifier(modifier),
  }
}

export function toNotation(dieType: DieType, count: number, modifier: number): string {
  const normalizedCount = normalizeCount(count)
  const normalizedModifier = normalizeModifier(modifier)
  const modifierText = normalizedModifier === 0 ? '' : normalizedModifier > 0 ? `+${normalizedModifier}` : `${normalizedModifier}`
  return `${normalizedCount}${dieType}${modifierText}`
}

export function rollDie(sides: number): number {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    return Math.floor(Math.random() * sides) + 1
  }

  const limit = 0x100000000 - (0x100000000 % sides)
  const buffer = new Uint32Array(1)
  let value = 0

  do {
    crypto.getRandomValues(buffer)
    value = buffer[0] ?? 0
  } while (value >= limit)

  return (value % sides) + 1
}

export function getSidesForDieType(dieType: DieType): number {
  return dieSidesByType[dieType]
}

export function generateTargetValues(dieType: DieType, count: number): number[] {
  const sides = getSidesForDieType(dieType)
  const normalizedCount = normalizeCount(count)
  return Array.from({ length: normalizedCount }, () => rollDie(sides))
}

export function summarizeRoll(dieType: DieType, modifier: number, targetValues: number[]): RollPreview {
  const total = targetValues.reduce((sum, value) => sum + value, 0) + normalizeModifier(modifier)
  const isSingleD20 = dieType === 'd20' && targetValues.length === 1
  const first = targetValues[0] ?? 0

  return {
    notation: toNotation(dieType, targetValues.length, modifier),
    results: targetValues,
    total,
    isNatTwenty: isSingleD20 && first === 20,
    isNatOne: isSingleD20 && first === 1,
  }
}

export function buildDiceRoll(input: BuildRollInput, targetValues: number[]): DiceRoll {
  const summary = summarizeRoll(input.dieType, input.modifier, targetValues)
  const now = new Date().toISOString()

  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `roll-${now}`,
    campaignId: input.campaignId,
    notation: summary.notation,
    dice: input.dieType,
    count: summary.results.length,
    results: summary.results,
    modifier: input.modifier,
    total: summary.total,
    isNatTwenty: summary.isNatTwenty,
    isNatOne: summary.isNatOne,
    rolledAt: now,
    label: input.label,
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function formatRollAnnouncement(roll: DiceRoll): string {
  const resultList = roll.results.join(', ')
  const natSuffix = roll.isNatTwenty ? ' Natural 20!' : roll.isNatOne ? ' Natural 1.' : ''
  return `Rolled ${roll.notation}: ${resultList}. Total: ${roll.total}.${natSuffix}`
}
