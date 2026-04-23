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
