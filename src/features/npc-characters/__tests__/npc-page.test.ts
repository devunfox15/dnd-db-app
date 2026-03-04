import { describe, expect, it } from 'vitest'

import FeaturePage from '@/features/npc-characters/page'

describe('NPC Characters page module', () => {
  it('exports a page component', () => {
    expect(FeaturePage).toBeTypeOf('function')
  })
})
