import { describe, expect, it } from 'vitest'

import type { Location, LocationPin } from '@/features/core/types'

describe('Location types', () => {
  it('accepts a location with pins', () => {
    const pin: LocationPin = {
      id: 'pin-1',
      x: 0.4,
      y: 0.6,
      label: 'Town Hall',
      linkedNpcIds: [],
      linkedNotes: [],
    }
    const location: Location = {
      id: 'loc-1',
      campaignId: 'campaign-1',
      name: 'Greenhollow',
      description: 'Sleepy frontier town',
      imageUrl: undefined,
      pins: [pin],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    expect(location.pins[0]?.label).toBe('Town Hall')
  })
})
