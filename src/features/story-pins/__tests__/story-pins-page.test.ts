import { describe, expect, it } from 'vitest'

import FeaturePage from '@/features/story-pins/page'

describe('Story Pins page module', () => {
  it('exports a page component', () => {
    expect(FeaturePage).toBeTypeOf('function')
  })
})
