import { describe, expect, it } from 'vitest'

import { buildImportedPlayerCharacter, mergeImportedPlayerCharacter } from '@/features/player-characters/state'

const imported = {
  campaignId: 'campaign-1',
  dndBeyondCharacterId: '162166285',
  sourceUrl: 'https://www.dndbeyond.com/characters/162166285',
  importSource: 'dndbeyond-url' as const,
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
  inventorySummary: ['Longbow x1'],
  spellSummary: ["Hunter's Mark"],
  sheet: {
    proficiencyBonus: 3,
    speed: [{ label: 'Walk', value: '35 ft' }],
    senses: [{ label: 'Darkvision', value: '60 ft' }],
    savingThrows: [],
    skills: [],
    proficienciesAndTraining: {
      languages: ['Common'],
      armor: ['Light Armor'],
      weapons: ['Simple Weapons'],
      tools: [],
      other: [],
    },
    actions: [],
    spells: [],
    featuresAndTraits: [],
    inventory: [],
    background: null,
    notes: null,
    extra: null,
    defense: {
      armorClass: 16,
      maxHp: 38,
      currentHp: 32,
      tempHp: 0,
      speed: 35,
      resistances: [],
      immunities: [],
      advantages: [],
    },
  },
  lastSyncedAt: '2026-03-10T00:00:00.000Z',
}

describe('player character state helpers', () => {
  it('builds a newly imported character with default local combat state', () => {
    const created = buildImportedPlayerCharacter(imported)

    expect(created.currentHp).toBe(32)
    expect(created.tempHp).toBe(0)
    expect(created.conditions).toEqual([])
    expect(created.concentration).toBe(false)
    expect(created.importStatus).toBe('ready')
    expect(created.importError).toBeNull()
    expect(created.sheet.proficiencyBonus).toBe(3)
  })

  it('preserves DM-managed combat state on refresh', () => {
    const merged = mergeImportedPlayerCharacter(
      {
        ...buildImportedPlayerCharacter(imported),
        id: 'pc-1',
        createdAt: '2026-03-09T00:00:00.000Z',
        updatedAt: '2026-03-09T00:00:00.000Z',
        currentHp: 18,
        tempHp: 5,
        conditions: ['Poisoned'],
        concentration: true,
        quickNotes: 'Track hunter mark target.',
      },
      {
        ...imported,
        armorClass: 17,
        currentHp: 30,
        tempHp: 2,
        lastSyncedAt: '2026-03-10T00:05:00.000Z',
      }
    )

    expect(merged.armorClass).toBe(17)
    expect(merged.currentHp).toBe(18)
    expect(merged.tempHp).toBe(5)
    expect(merged.conditions).toEqual(['Poisoned'])
    expect(merged.concentration).toBe(true)
    expect(merged.quickNotes).toBe('Track hunter mark target.')
    expect(merged.lastSyncedAt).toBe('2026-03-10T00:05:00.000Z')
    expect(merged.sheet.proficiencyBonus).toBe(3)
  })

  it('preserves import metadata on refresh', () => {
    const merged = mergeImportedPlayerCharacter(
      {
        ...buildImportedPlayerCharacter(imported),
        id: 'pc-1',
        createdAt: '2026-03-09T00:00:00.000Z',
        updatedAt: '2026-03-09T00:00:00.000Z',
      },
      {
        ...imported,
        armorClass: 17,
      }
    )

    expect(merged.importSource).toBe('dndbeyond-url')
    expect(merged.importFileName).toBeNull()
    expect(merged.sourceUrl).toBe('https://www.dndbeyond.com/characters/162166285')
    expect(merged.armorClass).toBe(17)
  })
})
