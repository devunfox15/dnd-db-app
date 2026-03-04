import { describe, expect, it } from 'vitest'

import { getCampaignDashboardItems, getCampaignExcerpt } from '@/features/campaigns/dashboard-logic'
import { createEmptyState } from '@/features/core/migrations'

describe('campaign dashboard logic', () => {
  it('sorts campaigns by derived last updated across related records', () => {
    const state = createEmptyState()

    state.campaigns = [
      {
        id: 'campaign-1',
        campaignId: 'campaign-1',
        name: 'Campaign 1',
        description: '',
        rpgSystem: 'dnd-5e',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        tags: [],
      },
      {
        id: 'campaign-2',
        campaignId: 'campaign-2',
        name: 'Campaign 2',
        description: '',
        rpgSystem: 'pathfinder-2e',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:01.000Z',
        tags: [],
      },
    ]

    state.timelineEvents = [
      {
        id: 'event-1',
        campaignId: 'campaign-1',
        title: 'Recent Event',
        details: 'Most recent update for campaign 1',
        sessionNumber: 1,
        orderIndex: 1,
        status: 'active',
        isCurrent: true,
        relatedNpcIds: [],
        relatedNoteIds: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        tags: [],
      },
    ]

    const items = getCampaignDashboardItems(state)
    expect(items[0]?.campaign.id).toBe('campaign-1')
  })

  it('prefers timeline details then story pin summary then campaign description for excerpt', () => {
    const state = createEmptyState()
    state.campaigns = [
      {
        id: 'campaign-1',
        campaignId: 'campaign-1',
        name: 'Campaign 1',
        description: 'Fallback campaign description',
        rpgSystem: 'dnd-5e',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        tags: [],
      },
    ]

    const campaign = state.campaigns[0]
    if (!campaign) {
      throw new Error('Expected campaign')
    }

    state.pins = [
      {
        id: 'pin-1',
        campaignId: 'campaign-1',
        title: 'Pin',
        summary: 'Story pin summary',
        status: 'active',
        sourceType: 'note',
        sourceId: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:01.000Z',
        tags: [],
      },
    ]

    expect(getCampaignExcerpt(campaign, state)).toBe('Story pin summary')

    state.timelineEvents = [
      {
        id: 'event-1',
        campaignId: 'campaign-1',
        title: 'Event',
        details: 'Timeline excerpt',
        sessionNumber: 1,
        orderIndex: 1,
        status: 'active',
        isCurrent: true,
        relatedNpcIds: [],
        relatedNoteIds: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:02.000Z',
        tags: [],
      },
    ]

    expect(getCampaignExcerpt(campaign, state)).toBe('Timeline excerpt')
  })
})
