import { describe, expect, it } from 'vitest'

import {
  generateTargetValues,
  parseNotation,
  rollDie,
  summarizeRoll,
  toNotation,
} from '@/features/dice-roller/dice-logic'

describe('dice logic', () => {
  it('parses notation with modifier', () => {
    expect(parseNotation('2d20+4')).toEqual({
      dieType: 'd20',
      count: 2,
      modifier: 4,
    })
  })

  it('normalizes notation input bounds', () => {
    expect(parseNotation('99d6-300')).toEqual({
      dieType: 'd6',
      count: 4,
      modifier: -99,
    })
  })

  it('parses d100 notation', () => {
    expect(parseNotation('2d100+1')).toEqual({
      dieType: 'd100',
      count: 2,
      modifier: 1,
    })
  })

  it('formats notation text', () => {
    expect(toNotation('d8', 2, 3)).toBe('2d8+3')
    expect(toNotation('d8', 2, 0)).toBe('2d8')
    expect(toNotation('d8', 2, -2)).toBe('2d8-2')
  })

  it('generates values in bounds', () => {
    const values = generateTargetValues('d12', 4)
    expect(values).toHaveLength(4)
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(12)
    }
  })

  it('produces approximately uniform d6 distribution', () => {
    const buckets = new Map<number, number>()
    const sampleCount = 6000

    for (let index = 0; index < sampleCount; index += 1) {
      const value = rollDie(6)
      buckets.set(value, (buckets.get(value) ?? 0) + 1)
    }

    const expectedPerBucket = sampleCount / 6
    for (let side = 1; side <= 6; side += 1) {
      const count = buckets.get(side) ?? 0
      expect(count).toBeGreaterThan(expectedPerBucket * 0.75)
      expect(count).toBeLessThan(expectedPerBucket * 1.25)
    }
  })

  it('detects natural 20 and natural 1', () => {
    expect(summarizeRoll('d20', 0, [20]).isNatTwenty).toBe(true)
    expect(summarizeRoll('d20', 0, [1]).isNatOne).toBe(true)
  })
})
