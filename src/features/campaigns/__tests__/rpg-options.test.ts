import { describe, expect, it } from 'vitest'

import { mvpRpgOptions, rpgLabel, rpgOptions } from '@/features/campaigns/rpg-options'

describe('rpg-options', () => {
  it('keeps all systems in the static registry', () => {
    expect(rpgOptions.map((o) => o.value)).toEqual([
      'dnd-5e',
      'pathfinder-2e',
      'call-of-cthulhu-7e',
      'cyberpunk-red',
    ])
  })

  it('exposes a 5e-only selectable list for MVP', () => {
    expect(mvpRpgOptions.map((o) => o.value)).toEqual(['dnd-5e'])
  })

  it('labels dnd-5e correctly', () => {
    expect(rpgLabel('dnd-5e')).toBe('D&D 5e')
  })
})
