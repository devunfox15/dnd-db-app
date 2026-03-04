import { describe, expect, it } from 'vitest'

import FeaturePage from '@/features/map-builder/page'

describe('Map Builder page module', () => {
  it('exports a page component', () => {
    expect(FeaturePage).toBeTypeOf('function')
  })
})
