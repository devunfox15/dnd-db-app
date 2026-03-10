import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'

import PlayerDetailPage from '@/features/session-workspace/player-detail-page'
import { createEmptyState } from '@/features/core/migrations'
import { resetRepositoryStateForTests } from '@/features/core/repository'

describe('Workspace player detail page', () => {
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
        classSummary: 'Warlock 5',
        level: 5,
        armorClass: 16,
        initiative: 3,
        speed: 35,
        currentHp: 32,
        maxHp: 38,
        tempHp: 5,
        abilityScores: { str: 12, dex: 16, con: 14, int: 10, wis: 15, cha: 18 },
        conditions: ['Poisoned'],
        concentration: true,
        inventorySummary: ['Longbow x1'],
        spellSummary: ["Hunter's Mark"],
        sheet: {
          proficiencyBonus: 3,
          speed: [
            { label: 'Walk', value: '35 ft' },
            { label: 'Fly', value: '0 ft' },
          ],
          senses: [{ label: 'Darkvision', value: '60 ft' }],
          savingThrows: [{ ability: 'wis', label: 'Wisdom', value: 5, proficient: true }],
          skills: [{ key: 'arcana', label: 'Arcana', ability: 'int', value: 3, proficient: true }],
          proficienciesAndTraining: {
            languages: ['Common', 'Elvish'],
            armor: ['Light Armor'],
            weapons: ['Simple Weapons'],
            tools: ["Alchemist's Supplies"],
            other: ['Trance'],
          },
          actions: [
            {
              name: 'Sneak Attack',
              description:
                '<p><strong>Deal</strong> extra damage once per turn.</p><ul><li>Requires finesse</li></ul>',
              activationType: 'Action',
            },
          ],
          spells: [
            {
              name: "Hunter's Mark",
              level: 1,
              source: 'Class',
              school: 'Divination',
              description:
                '<p><strong>Mark</strong> your prey with <em>mystic force</em>.</p><p>Pairs with [spells]Guidance[/spells].</p><table><tr><th style="color: #f00">Type</th></tr><tr><td>Combat</td></tr></table><script>alert(1)</script>',
              concentration: true,
              ritual: false,
              activationType: '1 Action',
              castingTime: '1 Action',
              range: '90 ft',
              duration: 'Concentration, up to 1 hour',
              components: ['V'],
              componentsDescription: '',
              tags: ['Combat'],
              prepared: false,
              alwaysPrepared: false,
              usesSpellSlot: true,
            },
          ],
          featuresAndTraits: [
            {
              name: 'Fey Ancestry',
              source: 'Race',
              description:
                '<p>Advantage on saves against <strong>charm</strong>.</p>',
            },
          ],
          inventory: [
            {
              name: 'Longbow',
              quantity: 1,
              equipped: true,
              isAttuned: true,
              type: 'Longbow',
              filterType: 'Weapon',
              subtype: 'Martial Weapon',
              rarity: 'Uncommon',
              attackType: 2,
              weaponCategoryId: 2,
              range: 150,
              longRange: 600,
              damage: '1d8',
              damageType: 'Piercing',
              description:
                '<p>Ammo weapon used for ranged attacks.</p>',
              detail: '1d8 Piercing',
              properties: ['Ammunition', 'Heavy'],
            },
            {
              name: 'Potion of Healing',
              quantity: 2,
              equipped: false,
              type: 'Potion',
              container: 'Backpack',
            },
          ],
          background: {
            name: 'Artisan',
            description:
              '<p style="color: #caa15a">A practiced craftsperson.</p><ul><li>Workshop trained</li></ul>',
            featureName: 'Crafter',
            proficiencies: ['Investigation', 'Persuasion'],
            tools: ["Alchemist's Supplies"],
            equipment: ["Traveler's Clothes"],
            feats: ['Crafter'],
          },
          notes: {
            allies: 'The Great One',
            backstory:
              '<p>&ldquo;Exiled heir&rdquo; of a fallen court.</p><p><em>Never returns home.</em></p>',
            personalityTraits:
              '<p>Always has a <strong>plan</strong>.</p>',
          },
          extra: {
            gender: 'Male',
            age: '296',
            eyes: 'Deep purple',
            height: "6'6",
            inspiration: 'No',
            gp: 47,
          },
          defense: {
            armorClass: 16,
            maxHp: 38,
            currentHp: 32,
            tempHp: 5,
            speed: 35,
            resistances: ['Fire'],
            immunities: ['Magical Sleep'],
            advantages: ['Charm saves'],
          },
        },
        quickNotes: 'Track concentration.',
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

  it('renders the tabbed player detail page with only the active panel content mounted', () => {
    const markup = renderToStaticMarkup(
      <PlayerDetailPage campaignId="campaign-1" playerCharacterId="pc-1" />
    )

    expect(markup).toContain('Prof Bonus')
    expect(markup).toContain('Senses')
    expect(markup).toContain('Actions')
    expect(markup).toContain('Features &amp; Traits')
    expect(markup).toContain('Background &amp; Notes')
    expect(markup).toContain('Darkvision')
    expect(markup).toContain('Unarmed Strike')
    expect(markup).toContain('1 + 1 Bludgeoning')
    expect(markup).toContain('Longbow')
    expect(markup).toContain('150/600 ft')
    expect(markup).toContain('+6')
    expect(markup).toContain('1d8 + 3 Piercing')
    expect(markup).toContain('Ammunition | Heavy')
    expect(markup).toContain('Poisoned')
    expect(markup).toContain('Track concentration.')
    expect(markup).not.toContain('Hunter&#x27;s Mark')
    expect(markup).not.toContain('Sneak Attack')
    expect(markup).not.toContain('Fey Ancestry')
    expect(markup).not.toContain('Artisan')
    expect(markup).not.toContain('The Great One')
    expect(markup).not.toContain('Deep purple')
    expect(markup).not.toContain('Proficiencies &amp; Training')
    expect(markup).not.toContain('<script>')
  })
})
