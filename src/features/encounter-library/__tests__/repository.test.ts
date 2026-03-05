import { beforeEach, describe, expect, it } from 'vitest'

import {
  encounterLibraryRepository,
  resetEncounterLibraryStateForTests,
} from '@/features/encounter-library/repository'

describe('encounterLibraryRepository', () => {
  beforeEach(() => {
    resetEncounterLibraryStateForTests()
  })

  it('creates, updates, and deletes encounter templates', () => {
    const campaignId = 'campaign-test-encounter-repo'

    const created = encounterLibraryRepository.create(campaignId, {
      name: 'Cult Ambush',
      terrain: 'Ruined chapel',
      notes: 'Use low light and pillars.',
      enemies: [
        {
          id: 'enemy-1',
          name: 'Cultist',
          hp: 9,
          initiative: 12,
          status: '',
        },
      ],
    })

    expect(encounterLibraryRepository.list(campaignId)).toHaveLength(1)
    expect(created.name).toBe('Cult Ambush')

    const updated = encounterLibraryRepository.update(created.id, {
      name: 'Cult Ambush Elite',
    })

    expect(updated?.name).toBe('Cult Ambush Elite')
    expect(encounterLibraryRepository.list(campaignId)[0]?.name).toBe(
      'Cult Ambush Elite',
    )

    expect(encounterLibraryRepository.delete(created.id)).toBe(true)
    expect(encounterLibraryRepository.list(campaignId)).toHaveLength(0)
  })
})
