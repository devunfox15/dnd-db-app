import { describe, expect, it } from 'vitest'

import {
  DICE_BOX_SCALE,
  DICE_BOX_SIZE,
  DICE_BOX_STARTING_HEIGHT,
  DICE_BOX_THEME,
  DICE_BOX_THEME_COLOR,
  DICE_BOX_THROW_FORCE,
  DICE_CANVAS_HEIGHT_CLASS,
} from '@/features/dice-roller/components/dice-canvas'

describe('DiceCanvas configuration', () => {
  it('uses high-contrast theme values and larger size tuning', () => {
    expect(DICE_BOX_SCALE).toBe(18)
    expect(DICE_BOX_THEME).toBe('default')
    expect(DICE_BOX_THEME_COLOR).toBe('#000000')
    expect(DICE_BOX_THROW_FORCE).toBe(2.8)
    expect(DICE_BOX_STARTING_HEIGHT).toBe(3.5)
    expect(DICE_BOX_SIZE).toBe(12)
  })

  it('uses the increased tray height class', () => {
    expect(DICE_CANVAS_HEIGHT_CLASS).toBe('h-full w-full')
  })
})
