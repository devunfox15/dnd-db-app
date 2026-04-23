import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'

const campaignId = 'campaign-x'

function baseState() {
  const state = createEmptyState()
  const now = new Date().toISOString()
  state.campaigns = [
    {
      id: campaignId,
      campaignId,
      name: 'Test Campaign',
      description: '',
      rpgSystem: 'dnd-5e',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
  ]
  state.activeCampaignId = campaignId
  return state
}

describe('new collections', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('creates a location via the generic repository', () => {
    const created = appRepository.create('locations', {
      campaignId,
      name: 'Greenhollow',
      description: 'Town',
      pins: [],
    })
    expect(created.id).toMatch(/^locations-/)
  })

  it('creates a session log entry via the generic repository', () => {
    const created = appRepository.create('sessionLog', {
      campaignId,
      kind: 'note',
      title: 'Opening beat',
      body: 'Party meets the hook NPC',
      timestamp: new Date().toISOString(),
    })
    expect(created.kind).toBe('note')
  })
})

describe('cleanupRelations for locations', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('removes deleted npc ids from location pins', () => {
    const npc = appRepository.create('npcs', {
      campaignId,
      name: 'Mayor',
      role: 'Leader',
      faction: '',
      notes: '',
      usedInMapIds: [],
      usedInTimelineEventIds: [],
      tags: [],
    })

    const location = appRepository.create('locations', {
      campaignId,
      name: 'Greenhollow',
      description: '',
      pins: [
        {
          id: 'pin-1',
          x: 0.1,
          y: 0.2,
          label: 'Mayor',
          linkedNpcIds: [npc.id],
          linkedNotes: [],
        },
      ],
    })

    appRepository.delete('npcs', npc.id)

    const refreshed = appRepository.list('locations').find((item) => item.id === location.id)
    expect(refreshed?.pins[0]?.linkedNpcIds).toEqual([])
  })
})

describe('deleteCampaignCascade for new collections', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('removes locations and session log entries scoped to the deleted campaign', () => {
    appRepository.create('locations', {
      campaignId,
      name: 'Greenhollow',
      description: '',
      pins: [],
    })
    appRepository.create('sessionLog', {
      campaignId,
      kind: 'note',
      title: 'Opening',
      body: '',
      timestamp: new Date().toISOString(),
    })

    appRepository.deleteCampaignCascade(campaignId)

    expect(appRepository.list('locations')).toEqual([])
    expect(appRepository.list('sessionLog')).toEqual([])
  })
})
