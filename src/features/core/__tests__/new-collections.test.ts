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

describe('sessionLog collection', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
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

describe('deleteCampaignCascade for sessionLog', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('removes session log entries scoped to the deleted campaign', () => {
    appRepository.create('sessionLog', {
      campaignId,
      kind: 'note',
      title: 'Opening',
      body: '',
      timestamp: new Date().toISOString(),
    })

    appRepository.deleteCampaignCascade(campaignId)

    expect(appRepository.list('sessionLog')).toEqual([])
  })
})
