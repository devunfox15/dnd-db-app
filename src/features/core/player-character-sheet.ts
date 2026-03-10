import type { PlayerCharacterSheet } from './types'

export function createEmptyPlayerCharacterSheet(): PlayerCharacterSheet {
  return {
    proficiencyBonus: 2,
    speed: [],
    senses: [],
    savingThrows: [],
    skills: [],
    proficienciesAndTraining: {
      languages: [],
      armor: [],
      weapons: [],
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
      armorClass: 10,
      maxHp: 0,
      currentHp: 0,
      tempHp: 0,
      speed: 30,
      resistances: [],
      immunities: [],
      advantages: [],
    },
  }
}
