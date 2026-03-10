import type { AbilityScores, PlayerCharacter } from '@/features/core/types'

export interface DndBeyondClass {
  level?: number
  definition?: {
    name?: string
    classFeatures?: Array<{
      name?: string
      description?: string
      requiredLevel?: number
    }>
  }
}

export interface DndBeyondNamedDescription {
  name?: string
  description?: string
}

export interface DndBeyondInventoryProperty {
  name?: string
  notes?: string | null
}

export interface DndBeyondChoiceOption {
  label?: string
  description?: string | null
}

export interface DndBeyondChoice {
  label?: string
  options?: DndBeyondChoiceOption[]
}

export interface DndBeyondFeatureChoiceGroups {
  race?: DndBeyondChoice[]
  class?: DndBeyondChoice[]
  background?: DndBeyondChoice[]
  item?: DndBeyondChoice[]
  feat?: DndBeyondChoice[]
}

export interface DndBeyondModifier {
  type?: string
  subType?: string
  value?: number
  fixedValue?: number | null
  restriction?: string
  friendlyTypeName?: string
  friendlySubtypeName?: string
  isGranted?: boolean
}

export interface DndBeyondAction {
  name?: string
  description?: string
  activation?: {
    activationType?: number
  }
  range?: {
    range?: number | null
    longRange?: number | null
  }
  dice?: {
    diceString?: string
  } | null
}

export interface DndBeyondCharacterResponse {
  data?: {
    id?: number | string
    name?: string
    gender?: string | null
    faith?: string | null
    age?: number | string | null
    hair?: string | null
    eyes?: string | null
    skin?: string | null
    height?: string | null
    weight?: number | string | null
    inspiration?: boolean
    currentHitPoints?: number
    temporaryHitPoints?: number
    baseHitPoints?: number
    bonusHitPoints?: number
    overrideHitPoints?: number | null
    removedHitPoints?: number
    alignmentId?: number | null
    lifestyleId?: number | null
    lifestyle?: {
      name?: string
    } | null
    armorClass?: number
    initiative?: number
    currencies?: {
      cp?: number
      sp?: number
      gp?: number
      ep?: number
      pp?: number
    }
    race?: {
      baseName?: string
      fullName?: string
      racialTraits?: Array<{
        isGranted?: boolean
        definition?: {
          name?: string
          description?: string
        }
      }>
      weightSpeeds?: {
        normal?: {
          walk?: number
          fly?: number
          burrow?: number
          swim?: number
          climb?: number
        }
      }
    }
    background?: {
      definition?: {
        name?: string
        description?: string
        shortDescription?: string
        featureName?: string
        featureDescription?: string
        skillProficienciesDescription?: string
        toolProficienciesDescription?: string
        equipmentDescription?: string
        grantedFeats?: Array<{ name?: string }>
      }
    }
    notes?: {
      allies?: string | null
      personalPossessions?: string | null
      otherHoldings?: string | null
      organizations?: string | null
      enemies?: string | null
      backstory?: string | null
      otherNotes?: string | null
    }
    traits?: {
      personalityTraits?: string | null
      ideals?: string | null
      bonds?: string | null
      flaws?: string | null
      appearance?: string | null
    }
    classes?: DndBeyondClass[]
    stats?: Array<{ value?: number }>
    inventory?: Array<{
      id?: number | string
      quantity?: number
      equipped?: boolean
      isAttuned?: boolean
      containerEntityId?: number | string | null
      definition?: {
        name?: string
        type?: string
        subType?: string | null
        filterType?: string | null
        rarity?: string | null
        description?: string | null
        cost?: number | null
        weight?: number | null
        tags?: string[]
        isContainer?: boolean
        canAttune?: boolean
        attackType?: number | null
        categoryId?: number | null
        range?: number | null
        longRange?: number | null
        damageType?: string | null
        damage?: { diceString?: string } | null
        armorClass?: number | null
        properties?: DndBeyondInventoryProperty[] | null
      }
    }>
    feats?: Array<{
      definition?: DndBeyondNamedDescription
    }>
    features?: Array<{
      definition?: DndBeyondNamedDescription
    }>
    options?: {
      race?: Array<{ definition?: DndBeyondNamedDescription }>
      class?: Array<{ definition?: DndBeyondNamedDescription }>
      background?: Array<{ definition?: DndBeyondNamedDescription }>
      item?: Array<{ definition?: DndBeyondNamedDescription }>
      feat?: Array<{ definition?: DndBeyondNamedDescription }>
    }
    choices?: DndBeyondFeatureChoiceGroups & {
      choiceDefinitions?: unknown[]
      definitionKeyNameMap?: Record<string, string>
    }
    customSenses?: Array<{
      name?: string
      distance?: number
    }>
    customSpeeds?: Array<{
      name?: string
      distance?: number
    }>
    classSpells?: Array<{
      spells?: DndBeyondSpellEntry[]
    }>
    spells?: {
      classSpells?: Array<{
        spells?: DndBeyondSpellEntry[]
      }>
      race?: DndBeyondSpellEntry[] | null
      class?: DndBeyondSpellEntry[] | null
      background?: DndBeyondSpellEntry[] | null
      item?: DndBeyondSpellEntry[] | null
      feat?: DndBeyondSpellEntry[] | null
    }
    actions?: {
      race?: DndBeyondAction[]
      class?: DndBeyondAction[]
      background?: DndBeyondAction[]
      item?: DndBeyondAction[]
      feat?: DndBeyondAction[]
    }
    modifiers?:
      | DndBeyondModifier[]
      | Record<string, DndBeyondModifier[]>
  }
}

export interface DndBeyondSpellEntry {
  prepared?: boolean
  alwaysPrepared?: boolean
  usesSpellSlot?: boolean
  additionalDescription?: string
  definition?: {
    name?: string
    level?: number
    school?: string
    description?: string
    concentration?: boolean
    ritual?: boolean
    tags?: string[]
    components?: number[]
    componentsDescription?: string
    activation?: {
      activationTime?: number
      activationType?: number
    }
    range?: {
      origin?: string
      rangeValue?: number
    }
    duration?: {
      durationType?: string
      durationInterval?: number
      durationUnit?: string | null
    }
  }
  range?: {
    origin?: string
    rangeValue?: number
  }
  activation?: {
    activationTime?: number
    activationType?: number
  }
}

export interface NormalizedPlayerCharacterInput {
  campaignId: string
  sourceUrl: string
  importSource?: PlayerCharacter['importSource']
  importFileName?: string | null
  payload: DndBeyondCharacterResponse
}

export interface ImportPlayerCharacterInput {
  campaignId: string
  url: string
}

export interface RefreshPlayerCharacterInput {
  campaignId: string
  playerCharacterId: string
  sourceUrl: string
  dndBeyondCharacterId: string
}

export type ImportedPlayerCharacter = Omit<
  PlayerCharacter,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'quickNotes'
  | 'conditions'
  | 'concentration'
  | 'importStatus'
  | 'importError'
>

export const emptyAbilityScores: AbilityScores = {
  str: 0,
  dex: 0,
  con: 0,
  int: 0,
  wis: 0,
  cha: 0,
}
