import { describe, expect, it, vi } from 'vitest'

import {
  buildClassSummary,
  extractDndBeyondCharacterId,
  mapDndBeyondCharacter,
  requestDndBeyondCharacter,
} from '@/features/player-characters/server/import-service'

function createPayload() {
  return {
    data: {
      id: 162166285,
      name: 'Arannis',
      gender: 'Male',
      age: 296,
      hair: 'Long silver hair',
      eyes: 'Deep purple',
      skin: 'Fair complexion',
      height: "6'6",
      weight: 300,
      inspiration: false,
      currentHitPoints: 32,
      temporaryHitPoints: 5,
      baseHitPoints: 38,
      bonusHitPoints: 4,
      removedHitPoints: 10,
      armorClass: 16,
      initiative: 3,
      currencies: {
        cp: 0,
        sp: 0,
        gp: 47,
        ep: 0,
        pp: 0,
      },
      race: { baseName: 'Elf' },
      background: {
        definition: {
          name: 'Artisan',
          shortDescription: 'A practiced craftsperson.',
          featureName: 'Crafter',
          featureDescription: 'Craft mundane goods faster.',
          skillProficienciesDescription: 'Investigation and Persuasion',
          toolProficienciesDescription: "Alchemist's Supplies",
          equipmentDescription: "Alchemist's Supplies, Traveler's Clothes",
          grantedFeats: [{ name: 'Crafter' }],
        },
      },
      notes: {
        allies: 'The Great One',
        enemies: 'A rival archmage',
        backstory: 'Exiled heir of a fallen court.',
      },
      traits: {
        personalityTraits: 'Always has a plan.',
        ideals: 'Freedom.',
        bonds: 'Protect the weak.',
        flaws: 'Cannot go home again.',
      },
      classes: [
        {
          level: 5,
          definition: {
            name: 'Ranger',
            classFeatures: [
              {
                name: 'Favored Enemy',
                description: 'You have significant experience studying a type of enemy.',
                requiredLevel: 1,
              },
              {
                name: 'Vanish',
                description: 'Hide as a bonus action.',
                requiredLevel: 14,
              },
            ],
          },
        },
        {
          level: 1,
          definition: {
            name: 'Rogue',
            classFeatures: [
              {
                name: 'Sneak Attack',
                description: 'Exploit a foe’s distraction.',
                requiredLevel: 1,
              },
            ],
          },
        },
      ],
      stats: [
        { value: 12 },
        { value: 16 },
        { value: 14 },
        { value: 10 },
        { value: 15 },
        { value: 8 },
      ],
      inventory: [
        {
          id: 1,
          quantity: 1,
          equipped: true,
          isAttuned: true,
          definition: {
            name: 'Longbow',
            type: 'Weapon',
            rarity: 'Uncommon',
            subType: 'Martial Weapon',
            damageType: 'Piercing',
            damage: { diceString: '1d8' },
            properties: [{ name: 'Ammunition' }, { name: 'Heavy' }],
          },
        },
        {
          id: 2,
          quantity: 2,
          equipped: false,
          containerEntityId: 3,
          definition: { name: 'Potion of Healing', type: 'Potion' },
        },
        {
          id: 3,
          quantity: 1,
          equipped: false,
          definition: { name: 'Backpack', type: 'Gear', isContainer: true },
        },
      ],
      feats: [
        {
          definition: {
            name: 'Dark Bargain',
            description: 'Accept a dangerous supernatural gift.',
          },
        },
      ],
      options: {
        race: [
          {
            definition: {
              name: 'High Elf Lineage',
              description: 'An awakened elven magical lineage.',
            },
          },
        ],
        class: [],
        background: [],
        item: [],
        feat: [],
      },
      choices: {
        race: [
          {
            label: 'High Elf - Intelligence',
            options: [
              {
                label: 'High Elf - Intelligence',
                description: 'Your lineage spells use Intelligence.',
              },
            ],
          },
        ],
        class: [],
        background: [],
        item: [],
        feat: [],
        choiceDefinitions: [],
        definitionKeyNameMap: {},
      },
      customSenses: [
        {
          senseId: 4,
          name: 'Tremorsense',
          distance: 10,
        },
      ],
      customSpeeds: [
        {
          movementId: 4,
          name: 'Climb',
          distance: 20,
        },
      ],
      spells: {
        race: [
          {
            prepared: false,
            alwaysPrepared: false,
            usesSpellSlot: false,
            definition: {
              name: 'Prestidigitation',
              level: 0,
              school: 'Transmutation',
              description: 'Create a small magical effect.',
              concentration: false,
              ritual: false,
              tags: ['Utility'],
              components: [1, 2],
              componentsDescription: '',
              activation: { activationTime: 1, activationType: 1 },
              range: { origin: 'Ranged', rangeValue: 10 },
              duration: { durationType: 'Time', durationInterval: 1, durationUnit: 'Hour' },
            },
            range: { origin: 'Ranged', rangeValue: 10 },
            activation: { activationTime: 1, activationType: 1 },
          },
        ],
        class: [
          {
            prepared: false,
            alwaysPrepared: false,
            usesSpellSlot: false,
            definition: {
              name: 'Guidance',
              level: 0,
              school: 'Divination',
              description: 'Touch a willing creature to aid a skill check.',
              concentration: true,
              ritual: false,
              tags: ['Buff'],
              components: [1, 2],
              componentsDescription: '',
              activation: { activationTime: 1, activationType: 1 },
              range: { origin: 'Touch', rangeValue: 0 },
              duration: { durationType: 'Concentration', durationInterval: 1, durationUnit: 'Minute' },
            },
            range: { origin: 'Touch', rangeValue: 0 },
            activation: { activationTime: 1, activationType: 1 },
          },
          {
            prepared: false,
            alwaysPrepared: false,
            usesSpellSlot: false,
            definition: {
              name: 'Mending',
              level: 0,
              school: 'Transmutation',
              description: 'Repair a single break or tear.',
              concentration: false,
              ritual: false,
              tags: ['Utility'],
              components: [1, 2, 3],
              componentsDescription: 'two lodestones',
              activation: { activationTime: 1, activationType: 6 },
              range: { origin: 'Touch', rangeValue: 0 },
              duration: { durationType: 'Instantaneous', durationInterval: 0, durationUnit: null },
            },
            range: { origin: 'Touch', rangeValue: 0 },
            activation: { activationTime: 1, activationType: 6 },
          },
          {
            prepared: false,
            alwaysPrepared: false,
            usesSpellSlot: true,
            definition: {
              name: "Hunter's Mark",
              level: 1,
              school: 'Divination',
              description: 'Mark your prey.',
              concentration: true,
              ritual: false,
              tags: ['Combat'],
              components: [1],
              componentsDescription: '',
              activation: { activationTime: 1, activationType: 1 },
              range: { origin: 'Ranged', rangeValue: 90 },
              duration: { durationType: 'Concentration', durationInterval: 1, durationUnit: 'Hour' },
            },
            range: { origin: 'Ranged', rangeValue: 90 },
            activation: { activationTime: 1, activationType: 1 },
          },
          {
            prepared: false,
            alwaysPrepared: false,
            usesSpellSlot: true,
            definition: {
              name: 'Cure Wounds',
              level: 1,
              school: 'Evocation',
              description: 'Restore hit points with a touch.',
              concentration: false,
              ritual: false,
              tags: ['Healing'],
              components: [1, 2],
              componentsDescription: '',
              activation: { activationTime: 1, activationType: 1 },
              range: { origin: 'Touch', rangeValue: 0 },
              duration: { durationType: 'Instantaneous', durationInterval: 0, durationUnit: null },
            },
            range: { origin: 'Touch', rangeValue: 0 },
            activation: { activationTime: 1, activationType: 1 },
          },
        ],
        background: null,
        item: [],
        feat: [],
      },
      actions: {
        race: [
          {
            name: 'Fey Step',
            description: 'Teleport a short distance.',
            activation: { activationType: 3 },
          },
        ],
        class: [
          {
            name: 'Sneak Attack',
            description: 'Deal extra damage once per turn.',
            activation: { activationType: 1 },
          },
        ],
        background: [],
        item: [
          {
            name: 'Longbow Shot',
            description: 'Make a ranged weapon attack.',
            activation: { activationType: 1 },
            dice: { diceString: '1d8' },
          },
        ],
        feat: [],
      },
      modifiers: {
        race: [
          {
            type: 'set',
            subType: 'speed',
            value: 35,
            friendlySubtypeName: 'Walking Speed',
          },
          {
            type: 'sense',
            subType: 'darkvision',
            value: 60,
            friendlySubtypeName: 'Darkvision',
          },
          {
            type: 'language',
            subType: 'common',
            friendlySubtypeName: 'Common',
            isGranted: true,
          },
        ],
        class: [
          {
            type: 'proficiency',
            subType: 'wisdom-saving-throws',
            friendlySubtypeName: 'Wisdom Saving Throws',
            isGranted: true,
          },
          {
            type: 'proficiency',
            subType: 'arcana',
            friendlySubtypeName: 'Arcana',
            isGranted: true,
          },
          {
            type: 'proficiency',
            subType: 'simple-weapons',
            friendlySubtypeName: 'Simple Weapons',
            isGranted: true,
          },
          {
            type: 'proficiency',
            subType: 'light-armor',
            friendlySubtypeName: 'Light Armor',
            isGranted: true,
          },
        ],
        background: [
          {
            type: 'proficiency',
            subType: 'persuasion',
            friendlySubtypeName: 'Persuasion',
            isGranted: true,
          },
          {
            type: 'proficiency',
            subType: 'alchemists-supplies',
            friendlySubtypeName: "Alchemist's Supplies",
            isGranted: true,
          },
        ],
        feat: [
          {
            type: 'bonus',
            subType: 'dexterity-score',
            value: 1,
            friendlySubtypeName: 'Dexterity Score',
            isGranted: true,
          },
          {
            type: 'resistance',
            subType: 'fire',
            friendlySubtypeName: 'Fire',
            isGranted: true,
          },
        ],
        condition: [],
        item: [],
      },
    },
  }
}

describe('player character import service helpers', () => {
  it('extracts character id from valid D&D Beyond urls', () => {
    expect(extractDndBeyondCharacterId('https://www.dndbeyond.com/characters/162166285')).toBe(
      '162166285'
    )
    expect(extractDndBeyondCharacterId('https://www.dndbeyond.com/profile/test/characters/152009531/')).toBe(
      '152009531'
    )
  })

  it('rejects invalid D&D Beyond urls', () => {
    expect(() => extractDndBeyondCharacterId('https://www.dndbeyond.com/classes/ranger')).toThrow(
      'Paste a valid D&D Beyond character URL.'
    )
  })

  it('builds a deterministic class summary', () => {
    expect(
      buildClassSummary([
        { level: 5, definition: { name: 'Ranger' } },
        { level: 1, definition: { name: 'Rogue' } },
      ])
    ).toBe('Ranger 5 / Rogue 1')
  })

  it('maps a D&D Beyond payload into the app player-character shape', () => {
    const mapped = mapDndBeyondCharacter({
      campaignId: 'campaign-1',
      sourceUrl: 'https://www.dndbeyond.com/characters/162166285',
      payload: createPayload(),
    })

    expect(mapped.dndBeyondCharacterId).toBe('162166285')
    expect(mapped.name).toBe('Arannis')
    expect(mapped.race).toBe('Elf')
    expect(mapped.classSummary).toBe('Ranger 5 / Rogue 1')
    expect(mapped.level).toBe(6)
    expect(mapped.currentHp).toBe(32)
    expect(mapped.maxHp).toBe(42)
    expect(mapped.tempHp).toBe(5)
    expect(mapped.speed).toBe(35)
    expect(mapped.abilityScores.dex).toBe(16)
    expect(mapped.inventorySummary).toEqual(['Longbow x1', 'Potion of Healing x2'])
    expect(mapped.spellSummary).toEqual([
      'Prestidigitation',
      'Guidance',
      'Mending',
      "Hunter's Mark",
      'Cure Wounds',
    ])
    expect(mapped.sheet.proficiencyBonus).toBe(3)
    expect(mapped.sheet.senses).toEqual([
      { label: 'Darkvision', value: '60 ft' },
      { label: 'Tremorsense', value: '10 ft' },
    ])
    expect(mapped.sheet.speed).toContainEqual({ label: 'Climb', value: '20 ft' })
    expect(mapped.sheet.savingThrows.find((entry) => entry.ability === 'wis')).toMatchObject({
      ability: 'wis',
      proficient: true,
      value: 5,
    })
    expect(mapped.sheet.skills.find((entry) => entry.key === 'arcana')).toMatchObject({
      key: 'arcana',
      proficient: true,
      value: 3,
    })
    expect(mapped.sheet.proficienciesAndTraining.languages).toContain('Common')
    expect(mapped.sheet.proficienciesAndTraining.tools).toContain("Alchemist's Supplies")
    expect(mapped.sheet.proficienciesAndTraining.weapons).toContain('Simple Weapons')
    expect(mapped.sheet.proficienciesAndTraining.armor).toContain('Light Armor')
    expect(mapped.sheet.actions.map((entry) => entry.name)).toEqual([
      'Fey Step',
      'Sneak Attack',
      'Longbow Shot',
    ])
    expect(mapped.sheet.spells.find((entry) => entry.name === 'Prestidigitation')).toMatchObject({
      name: 'Prestidigitation',
      level: 0,
      source: 'Race',
      school: 'Transmutation',
      range: '10 ft',
      duration: '1 hour',
      components: ['V', 'S'],
    })
    expect(mapped.sheet.spells.find((entry) => entry.name === 'Guidance')).toMatchObject({
      name: 'Guidance',
      source: 'Class',
      concentration: true,
      activationType: '1 Action',
      duration: 'Concentration, up to 1 minute',
    })
    expect(mapped.sheet.spells.find((entry) => entry.name === 'Mending')).toMatchObject({
      name: 'Mending',
      source: 'Class',
      componentsDescription: 'two lodestones',
      activationType: '1 Hour',
      duration: 'Instantaneous',
    })
    expect(mapped.sheet.featuresAndTraits.some((entry) => entry.name === 'Favored Enemy')).toBe(
      true
    )
    expect(mapped.sheet.featuresAndTraits.some((entry) => entry.name === 'Vanish')).toBe(false)
    expect(mapped.sheet.featuresAndTraits.some((entry) => entry.name === 'Crafter')).toBe(true)
    expect(mapped.sheet.featuresAndTraits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Dark Bargain',
          source: 'Feat',
          description: 'Accept a dangerous supernatural gift.',
        }),
        expect.objectContaining({
          name: 'High Elf Lineage',
          source: 'Option',
        }),
        expect.objectContaining({
          name: 'High Elf - Intelligence',
          source: 'Choice',
        }),
      ])
    )
    expect(mapped.sheet.inventory[0]).toMatchObject({
      name: 'Longbow',
      quantity: 1,
      equipped: true,
      isAttuned: true,
      rarity: 'Uncommon',
      properties: ['Ammunition', 'Heavy'],
      container: undefined,
    })
    expect(mapped.sheet.inventory.find((entry) => entry.name === 'Potion of Healing')).toMatchObject({
      container: 'Backpack',
    })
    expect(mapped.sheet.background).toMatchObject({
      name: 'Artisan',
      featureName: 'Crafter',
    })
    expect(mapped.sheet.notes).toMatchObject({
      backstory: 'Exiled heir of a fallen court.',
      personalityTraits: 'Always has a plan.',
    })
    expect(mapped.sheet.extra).toMatchObject({
      gender: 'Male',
      age: '296',
      height: "6'6",
      gp: 47,
    })
    expect(mapped.sheet.defense.resistances).toContain('Fire')
    expect(mapped.sheet.defense.maxHp).toBe(42)
    expect(mapped.sheet.defense.currentHp).toBe(32)
  })

  it('falls back to removed hit points when current hit points are absent', () => {
    const payload = createPayload()
    delete payload.data.currentHitPoints

    const mapped = mapDndBeyondCharacter({
      campaignId: 'campaign-1',
      sourceUrl: 'https://www.dndbeyond.com/characters/162166285',
      payload,
    })

    expect(mapped.maxHp).toBe(42)
    expect(mapped.currentHp).toBe(32)
    expect(mapped.sheet.defense.currentHp).toBe(32)
  })

  it('maps speed when D&D Beyond returns grouped modifiers instead of a flat array', () => {
    const payload = createPayload()
    payload.data.modifiers = {
      race: [
        {
          type: 'set',
          subType: 'speed',
          value: 35,
          friendlySubtypeName: 'Walking Speed',
        },
      ],
      class: [],
      item: [],
    }

    const mapped = mapDndBeyondCharacter({
      campaignId: 'campaign-1',
      sourceUrl: 'https://www.dndbeyond.com/characters/162166285',
      payload,
    })

    expect(mapped.speed).toBe(35)
  })

  it('returns a user-safe message for private or inaccessible characters', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 403 }))

    await expect(
      requestDndBeyondCharacter('162166285', {
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).rejects.toThrow('Character must be public to import from a URL.')
  })
})
