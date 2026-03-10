import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyState } from '@/features/core/migrations'
import { createEmptyPlayerCharacterSheet } from '@/features/core/player-character-sheet'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'

const campaignId = 'campaign-test'

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

describe('playerCharacters repository support', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('creates and updates imported player characters', () => {
    const created = appRepository.create('playerCharacters', {
      campaignId,
      dndBeyondCharacterId: '162166285',
      sourceUrl: 'https://www.dndbeyond.com/characters/162166285',
      importSource: 'dndbeyond-url',
      importFileName: null,
      name: 'Arannis',
      race: 'Elf',
      classSummary: 'Ranger 5',
      level: 5,
      armorClass: 16,
      initiative: 3,
      speed: 35,
      currentHp: 32,
      maxHp: 38,
      tempHp: 0,
      abilityScores: { str: 12, dex: 16, con: 14, int: 10, wis: 15, cha: 8 },
      conditions: [],
      concentration: false,
      inventorySummary: ['Longbow x1'],
      spellSummary: ["Hunter's Mark"],
      sheet: createEmptyPlayerCharacterSheet(),
      quickNotes: '',
      lastSyncedAt: new Date().toISOString(),
      importStatus: 'ready',
      importError: null,
      tags: [],
    })

    expect(created.id).toBeTruthy()

    const updated = appRepository.update('playerCharacters', created.id, {
      quickNotes: 'Watching for concentration.',
      currentHp: 18,
    })

    expect(updated?.quickNotes).toBe('Watching for concentration.')
    expect(updated?.currentHp).toBe(18)
  })

  it('deletes player characters when the campaign is deleted', () => {
    appRepository.create('playerCharacters', {
      campaignId,
      dndBeyondCharacterId: '162166285',
      sourceUrl: 'https://www.dndbeyond.com/characters/162166285',
      importSource: 'dndbeyond-url',
      importFileName: null,
      name: 'Arannis',
      race: 'Elf',
      classSummary: 'Ranger 5',
      level: 5,
      armorClass: 16,
      initiative: 3,
      speed: 35,
      currentHp: 32,
      maxHp: 38,
      tempHp: 0,
      abilityScores: { str: 12, dex: 16, con: 14, int: 10, wis: 15, cha: 8 },
      conditions: [],
      concentration: false,
      inventorySummary: [],
      spellSummary: [],
      sheet: createEmptyPlayerCharacterSheet(),
      quickNotes: '',
      lastSyncedAt: new Date().toISOString(),
      importStatus: 'ready',
      importError: null,
      tags: [],
    })

    appRepository.deleteCampaignCascade(campaignId)

    expect(appRepository.getState().playerCharacters).toHaveLength(0)
  })
})
