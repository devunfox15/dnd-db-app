import { describe, expect, it } from 'vitest'

import { currentVersion, migrateState } from '@/features/core/migrations'

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

    expect(migrated.version).toBe(currentVersion)
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

  it('normalizes legacy player character import sources to url imports', () => {
    const now = new Date().toISOString()
    const migrated = migrateState({
      version: 2,
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
      ],
      notes: [],
      pins: [],
      maps: [],
      npcs: [],
      playerCharacters: [
        {
          id: 'pc-1',
          campaignId: 'campaign-1',
          dndBeyondCharacterId: '162166285',
          sourceUrl: 'https://www.dndbeyond.com/characters/162166285',
          importSource: 'json-upload',
          importFileName: 'pc-arannis01.json',
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
          sheet: null,
          quickNotes: '',
          lastSyncedAt: now,
          importStatus: 'ready',
          importError: null,
          createdAt: now,
          updatedAt: now,
          tags: [],
        },
      ],
      timelineEvents: [],
      lookupEntries: [],
    })

    expect(migrated.playerCharacters[0]?.importSource).toBe('dndbeyond-url')
    expect(migrated.playerCharacters[0]?.importFileName).toBe('pc-arannis01.json')
    expect(migrated.playerCharacters[0]?.sheet).toBeTruthy()
    expect(migrated.playerCharacters[0]?.sheet.proficienciesAndTraining.languages).toEqual([])
  })
})
