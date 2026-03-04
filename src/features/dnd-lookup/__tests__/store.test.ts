import { describe, expect, it } from 'vitest'

import { filterLookupEntries } from '@/features/dnd-lookup/store'

describe('filterLookupEntries', () => {
  it('filters by title/category/summary/details', () => {
    const entries = [
      { title: 'Opportunity Attack', category: 'Combat', summary: 'reaction attack', details: 'leave reach' },
      { title: 'Short Rest', category: 'Rest', summary: 'recover abilities', details: 'one hour downtime' },
    ]

    expect(filterLookupEntries(entries, 'combat')).toHaveLength(1)
    expect(filterLookupEntries(entries, 'downtime')).toHaveLength(1)
    expect(filterLookupEntries(entries, 'missing')).toHaveLength(0)
  })
})
