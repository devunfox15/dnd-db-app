import { describe, expect, it } from 'vitest'

import FeaturePage from '@/features/campaigns/page'

describe('Campaigns dashboard page module', () => {
  it('exports a page component', () => {
    expect(FeaturePage).toBeTypeOf('function')
  })
})
