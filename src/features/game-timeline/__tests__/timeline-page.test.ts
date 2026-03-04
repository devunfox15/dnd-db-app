import { describe, expect, it } from 'vitest'

import FeaturePage from '@/features/game-timeline/page'

describe('Game Timeline page module', () => {
  it('exports a page component', () => {
    expect(FeaturePage).toBeTypeOf('function')
  })
})
