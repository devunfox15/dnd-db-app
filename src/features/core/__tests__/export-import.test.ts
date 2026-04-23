import { beforeEach, describe, expect, it } from 'vitest'

import { exportState, importState } from '@/features/core/export-import'
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

describe('exportState / importState', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('roundtrips state through export and import', () => {
    appRepository.create('sessionLog', {
      campaignId,
      kind: 'note',
      title: 'Greenhollow',
      body: 'Sleepy frontier town',
      timestamp: new Date().toISOString(),
    })
    const exported = exportState()
    expect(typeof exported).toBe('string')

    resetRepositoryStateForTests(createEmptyState())
    expect(appRepository.list('sessionLog')).toEqual([])

    const result = importState(exported)
    expect(result.ok).toBe(true)
    expect(appRepository.list('sessionLog').map((entry) => entry.title)).toEqual(['Greenhollow'])
  })

  it('rejects malformed input', () => {
    const result = importState('{ not json')
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toMatch(/parse|invalid/i)
  })
})
