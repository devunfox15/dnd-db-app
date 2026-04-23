import { describe, expect, it } from 'vitest'

import type { SessionLogEntry } from '@/features/core/types'

describe('SessionLogEntry type', () => {
  it('accepts a well-formed entry', () => {
    const entry: SessionLogEntry = {
      id: 'log-1',
      campaignId: 'campaign-1',
      sessionId: 'session-1',
      kind: 'note',
      title: 'Party meets the mayor',
      body: 'Short exchange at the town gate.',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['hook'],
    }
    expect(entry.kind).toBe('note')
  })
})
