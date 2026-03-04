import { describe, expect, it } from 'vitest'

import FeaturePage from '@/features/home/page'

describe('Home page module', () => {
  it('exports a page component', () => {
    expect(FeaturePage).toBeTypeOf('function')
  })
})
