import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import FeaturePage from '@/features/session-workspace/player-page'
import { createEmptyState } from '@/features/core/migrations'
import { createEmptyPlayerCharacterSheet } from '@/features/core/player-character-sheet'
import { resetRepositoryStateForTests } from '@/features/core/repository'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
}))

describe('Workspace player page module', () => {
  beforeEach(() => {
    const state = createEmptyState()
    const now = new Date().toISOString()
    state.campaigns = [
      {
        id: 'campaign-1',
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        description: '',
        rpgSystem: 'dnd-5e',
        createdAt: now,
        updatedAt: now,
        tags: [],
      },
    ]
    state.playerCharacters = [
      {
        id: 'pc-1',
        campaignId: 'campaign-1',
        dndBeyondCharacterId: '100',
        sourceUrl: 'https://www.dndbeyond.com/characters/100',
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
        lastSyncedAt: now,
        importStatus: 'ready',
        importError: null,
        createdAt: now,
        updatedAt: now,
        tags: [],
      },
      {
        id: 'pc-2',
        campaignId: 'campaign-1',
        dndBeyondCharacterId: '101',
        sourceUrl: 'https://www.dndbeyond.com/characters/101',
        importSource: 'dndbeyond-url',
        importFileName: null,
        name: 'Bryn',
        race: 'Human',
        classSummary: 'Cleric 4',
        level: 4,
        armorClass: 18,
        initiative: 0,
        speed: 30,
        currentHp: 28,
        maxHp: 28,
        tempHp: 4,
        abilityScores: { str: 10, dex: 10, con: 14, int: 12, wis: 16, cha: 13 },
        conditions: ['Blessed'],
        concentration: true,
        inventorySummary: [],
        spellSummary: [],
        sheet: createEmptyPlayerCharacterSheet(),
        quickNotes: '',
        lastSyncedAt: now,
        importStatus: 'ready',
        importError: null,
        createdAt: now,
        updatedAt: now,
        tags: [],
      },
    ]
    resetRepositoryStateForTests(state)
  })

  it('exports a page component', () => {
    expect(FeaturePage).toBeTypeOf('function')
  })

  it('shows one party refresh action and one remove action per saved character', () => {
    const markup = renderToStaticMarkup(<FeaturePage campaignId="campaign-1" />)

    expect(markup).toContain('Refresh Party')
    expect(markup.match(/>Remove</g)).toHaveLength(2)
    expect(markup).not.toContain('Refresh Character')
  })
})
