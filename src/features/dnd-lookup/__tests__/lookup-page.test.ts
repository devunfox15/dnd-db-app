import { describe, expect, it } from 'vitest'

import FeaturePage from '@/features/dnd-lookup/page'

describe('D&D Lookup page module', () => {
  it('exports a page component', () => {
    expect(FeaturePage).toBeTypeOf('function')
  })
})
