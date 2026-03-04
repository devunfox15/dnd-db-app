import { describe, expect, it } from 'vitest'

import FeaturePage from '@/features/dm-notepad/page'

describe('DM Notepad page module', () => {
  it('exports a page component', () => {
    expect(FeaturePage).toBeTypeOf('function')
  })
})
