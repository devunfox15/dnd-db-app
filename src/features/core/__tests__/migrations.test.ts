import { describe, expect, it } from 'vitest'

import { migrateState } from '@/features/core/migrations'

describe('migrateState', () => {
  it('migrates legacy v1 state with default rpg system and active campaign', () => {
    const now = new Date().toISOString()
    const migrated = migrateState({
      version: 1,
      campaigns: [
        {
          id: 'campaign-1',
          campaignId: 'campaign-1',
          name: 'Legacy Campaign',
          description: '',
          createdAt: now,
          updatedAt: now,
          tags: [],
        },
      ],
      notes: [],
      pins: [],
      maps: [],
      npcs: [],
      timelineEvents: [],
      lookupEntries: [],
    })

    expect(migrated.version).toBe(2)
    expect(migrated.campaigns[0]?.rpgSystem).toBe('dnd-5e')
    expect(migrated.activeCampaignId).toBe('campaign-1')
  })

  it('keeps existing valid active campaign id', () => {
    const now = new Date().toISOString()
    const migrated = migrateState({
      version: 1,
      activeCampaignId: 'campaign-2',
      campaigns: [
        {
          id: 'campaign-1',
          campaignId: 'campaign-1',
          name: 'Campaign 1',
          description: '',
          rpgSystem: 'dnd-5e',
          createdAt: now,
          updatedAt: now,
          tags: [],
        },
        {
          id: 'campaign-2',
          campaignId: 'campaign-2',
          name: 'Campaign 2',
          description: '',
          rpgSystem: 'pathfinder-2e',
          createdAt: now,
          updatedAt: now,
          tags: [],
        },
      ],
      notes: [],
      pins: [],
      maps: [],
      npcs: [],
      timelineEvents: [],
      lookupEntries: [],
    })

    expect(migrated.activeCampaignId).toBe('campaign-2')
  })
})
