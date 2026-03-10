import { createEmptyPlayerCharacterSheet } from '@/features/core/player-character-sheet'
import type {
  AbilityKey,
  PlayerCharacterAction,
  PlayerCharacterFeatureTrait,
  PlayerCharacterInventoryItem,
  PlayerCharacterLabeledValue,
  PlayerCharacterSavingThrow,
  PlayerCharacterSkill,
} from '@/features/core/types'
import type {
  DndBeyondAction,
  DndBeyondCharacterResponse,
  DndBeyondChoice,
  DndBeyondClass,
  DndBeyondModifier,
  DndBeyondNamedDescription,
  DndBeyondSpellEntry,
  NormalizedPlayerCharacterInput,
} from '@/features/player-characters/types'
import { emptyAbilityScores } from '@/features/player-characters/types'

const DND_BEYOND_API_BASE = 'https://character-service.dndbeyond.com/character/v5/character'

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

const SKILL_TO_ABILITY: Record<string, AbilityKey> = {
  acrobatics: 'dex',
  'animal-handling': 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  'sleight-of-hand': 'dex',
  stealth: 'dex',
  survival: 'wis',
}

const ACTIVATION_TYPES: Record<number, string> = {
  1: 'Action',
  2: 'Bonus Action',
  3: 'Reaction',
  4: 'Minute',
  6: 'Hour',
  8: 'Special',
}

const ALIGNMENT_LABELS: Record<number, string> = {
  1: 'Lawful Good',
  2: 'Neutral Good',
  3: 'Chaotic Good',
  4: 'Lawful Neutral',
  5: 'Neutral',
  6: 'Chaotic Neutral',
  7: 'Lawful Evil',
  8: 'Neutral Evil',
  9: 'Chaotic Evil',
}

function readStat(stats: Array<{ value?: number }> | undefined, index: number) {
  return stats?.[index]?.value ?? 0
}

function toAbilityScores(stats: Array<{ value?: number }> | undefined) {
  return {
    str: readStat(stats, 0),
    dex: readStat(stats, 1),
    con: readStat(stats, 2),
    int: readStat(stats, 3),
    wis: readStat(stats, 4),
    cha: readStat(stats, 5),
  }
}

function getAbilityMod(score: number) {
  return Math.floor((score - 10) / 2)
}

function toTitleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])]
}

function normalizeLabel(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim()
}

function modifierValue(modifier: DndBeyondModifier) {
  return modifier.value ?? modifier.fixedValue ?? 0
}

function flattenModifiers(
  modifiers:
    | DndBeyondModifier[]
    | Record<string, DndBeyondModifier[]>
    | undefined
) {
  if (Array.isArray(modifiers)) {
    return modifiers
  }

  return Object.values(modifiers ?? {}).flat()
}

function buildSkillSummaryLabel(subType: string) {
  return subType === 'sleight-of-hand' ? 'Sleight of Hand' : toTitleCase(subType)
}

function toInventorySummary(
  inventory:
    | Array<{
        quantity?: number
        definition?: { name?: string; isContainer?: boolean }
      }>
    | undefined
) {
  return (inventory ?? [])
    .map((item) => {
      if (item.definition?.isContainer) {
        return null
      }
      const name = item.definition?.name?.trim()
      if (!name) {
        return null
      }

      const quantity = item.quantity ?? 1
      return `${name} x${quantity}`
    })
    .filter((entry): entry is string => Boolean(entry))
}

function toSpellSummary(payload: DndBeyondCharacterResponse['data']) {
  return collectSpellEntries(payload)
    .map((spell) => spell.definition?.name?.trim() ?? '')
    .filter(Boolean)
}

function toSpeedEntries(payload: DndBeyondCharacterResponse['data']) {
  const entries = new Map<string, string>()
  const speeds = payload?.race?.weightSpeeds?.normal

  if (speeds) {
    const ordered = [
      ['Walk', speeds.walk],
      ['Fly', speeds.fly],
      ['Swim', speeds.swim],
      ['Climb', speeds.climb],
      ['Burrow', speeds.burrow],
    ] as const

    for (const [label, value] of ordered) {
      if (typeof value === 'number' && value > 0) {
        entries.set(label, `${value} ft`)
      }
    }
  }

  for (const speed of payload?.customSpeeds ?? []) {
    const label = normalizeLabel(speed.name)
    if (label && typeof speed.distance === 'number' && speed.distance > 0) {
      entries.set(label, `${speed.distance} ft`)
    }
  }

  if (entries.size === 0) {
    const modifierList = flattenModifiers(payload?.modifiers)
    const speedModifier = modifierList.find(
      (modifier) =>
        modifier?.subType === 'speed' ||
        modifier?.friendlySubtypeName?.toLowerCase().includes('speed')
    )

    entries.set('Walk', `${speedModifier?.value ?? 30} ft`)
  } else if (!entries.has('Walk')) {
    const modifierList = flattenModifiers(payload?.modifiers)
    const speedModifier = modifierList.find(
      (modifier) =>
        modifier?.subType === 'speed' ||
        modifier?.friendlySubtypeName?.toLowerCase().includes('speed')
    )
    if (typeof speedModifier?.value === 'number') {
      entries.set('Walk', `${speedModifier.value} ft`)
    }
  }

  return [...entries.entries()].map(([label, value]) => ({ label, value }))
}

function toSpeed(payload: DndBeyondCharacterResponse['data']) {
  const walkSpeed = toSpeedEntries(payload).find((entry) => entry.label === 'Walk')
  return Number.parseInt(walkSpeed?.value ?? '30', 10) || 30
}

function toSenses(modifiers: DndBeyondCharacterResponse['data'] extends infer T
  ? T extends { modifiers?: infer M }
    ? M
    : never
  : never) {
  return flattenModifiers(modifiers)
    .filter((modifier) => modifier.type === 'sense')
    .map((modifier) => ({
      label: modifier.friendlySubtypeName ?? toTitleCase(modifier.subType ?? 'Sense'),
      value: `${modifierValue(modifier)} ft`,
    }))
}

function mergeSenses(payload: DndBeyondCharacterResponse['data']) {
  const senses = new Map<string, string>()
  for (const sense of toSenses(payload?.modifiers)) {
    senses.set(sense.label, sense.value)
  }
  for (const sense of payload?.customSenses ?? []) {
    const label = normalizeLabel(sense.name)
    if (label && typeof sense.distance === 'number' && sense.distance > 0) {
      senses.set(label, `${sense.distance} ft`)
    }
  }
  return [...senses.entries()].map(([label, value]) => ({ label, value }))
}

function toSavingThrows(
  abilityScores: NormalizedPlayerCharacterInput extends infer _
    ? Record<AbilityKey, number>
    : never,
  modifiers: DndBeyondCharacterResponse['data'] extends infer T
    ? T extends { modifiers?: infer M }
      ? M
      : never
    : never,
  proficiencyBonus: number
) {
  const modifierList = flattenModifiers(modifiers)

  return ABILITY_KEYS.map<PlayerCharacterSavingThrow>((ability) => {
    const proficient = modifierList.some(
      (modifier) =>
        modifier.type === 'proficiency' &&
        modifier.subType === `${abilityToWord(ability)}-saving-throws` &&
        modifier.isGranted !== false
    )

    return {
      ability,
      label: ABILITY_LABELS[ability],
      proficient,
      value: getAbilityMod(abilityScores[ability]) + (proficient ? proficiencyBonus : 0),
    }
  })
}

function toSkills(
  abilityScores: Record<AbilityKey, number>,
  modifiers: DndBeyondCharacterResponse['data'] extends infer T
    ? T extends { modifiers?: infer M }
      ? M
      : never
    : never,
  proficiencyBonus: number
) {
  const modifierList = flattenModifiers(modifiers)

  return Object.entries(SKILL_TO_ABILITY).map<PlayerCharacterSkill>(([key, ability]) => {
    const relevant = modifierList.filter((modifier) => modifier.subType === key)
    const proficient = relevant.some(
      (modifier) => modifier.type === 'proficiency' && modifier.isGranted !== false
    )
    const extraBonus = relevant
      .filter((modifier) => modifier.type === 'bonus')
      .reduce((sum, modifier) => sum + modifierValue(modifier), 0)

    return {
      key,
      label: buildSkillSummaryLabel(key),
      ability,
      proficient,
      value:
        getAbilityMod(abilityScores[ability]) + (proficient ? proficiencyBonus : 0) + extraBonus,
    }
  })
}

function toProficienciesAndTraining(
  modifiers: DndBeyondCharacterResponse['data'] extends infer T
    ? T extends { modifiers?: infer M }
      ? M
      : never
    : never
) {
  const modifierList = flattenModifiers(modifiers).filter((modifier) => modifier.isGranted !== false)
  const result = {
    languages: [] as string[],
    armor: [] as string[],
    weapons: [] as string[],
    tools: [] as string[],
    other: [] as string[],
  }

  for (const modifier of modifierList) {
    const label = modifier.friendlySubtypeName ?? toTitleCase(modifier.subType ?? '')
    if (!label) continue

    if (modifier.type === 'language') {
      result.languages.push(label)
      continue
    }

    if (modifier.type === 'proficiency') {
      if (label.toLowerCase().includes('armor')) {
        result.armor.push(label)
      } else if (label.toLowerCase().includes('weapon')) {
        result.weapons.push(label)
      } else if (
        label.toLowerCase().includes('supplies') ||
        label.toLowerCase().includes('tools') ||
        label.toLowerCase().includes('utensils')
      ) {
        result.tools.push(label)
      } else {
        result.other.push(label)
      }
      continue
    }

    if (modifier.type === 'immunity' || modifier.type === 'advantage') {
      result.other.push(label)
    }
  }

  return {
    languages: uniqueStrings(result.languages),
    armor: uniqueStrings(result.armor),
    weapons: uniqueStrings(result.weapons),
    tools: uniqueStrings(result.tools),
    other: uniqueStrings(result.other),
  }
}

function mapAction(action: DndBeyondAction): PlayerCharacterAction | null {
  const name = action.name?.trim()
  if (!name) return null

  const range =
    typeof action.range?.range === 'number'
      ? `${action.range.range}${action.range.longRange ? ` / ${action.range.longRange}` : ''} ft`
      : undefined

  return {
    name,
    description: action.description?.trim() ?? '',
    activationType: ACTIVATION_TYPES[action.activation?.activationType ?? 0],
    range,
    damage: action.dice?.diceString,
  }
}

function toActions(actions: DndBeyondCharacterResponse['data'] extends infer T
  ? T extends { actions?: infer A }
    ? A
    : never
  : never) {
  if (!actions) return []

  return [
    ...(actions.race ?? []),
    ...(actions.class ?? []),
    ...(actions.background ?? []),
    ...(actions.item ?? []),
    ...(actions.feat ?? []),
  ]
    .map(mapAction)
    .filter((entry): entry is PlayerCharacterAction => Boolean(entry))
}

function collectSpellEntries(payload: DndBeyondCharacterResponse['data']) {
  const fromLegacyGroups =
    payload?.classSpells?.flatMap((group) => group.spells ?? []).map((spell) => ({
      source: 'Class',
      spell,
    })) ?? []

  const grouped = payload?.spells
  const fromGrouped = [
    ...(grouped?.race?.map((spell) => ({ source: 'Race', spell })) ?? []),
    ...(grouped?.class?.map((spell) => ({ source: 'Class', spell })) ?? []),
    ...(grouped?.background?.map((spell) => ({ source: 'Background', spell })) ?? []),
    ...(grouped?.item?.map((spell) => ({ source: 'Item', spell })) ?? []),
    ...(grouped?.feat?.map((spell) => ({ source: 'Feat', spell })) ?? []),
    ...(grouped?.classSpells?.flatMap((group) => (group.spells ?? []).map((spell) => ({ source: 'Class', spell }))) ?? []),
  ]

  const deduped = new Map<string, { source: string; spell: DndBeyondSpellEntry }>()
  for (const entry of [...fromGrouped, ...fromLegacyGroups]) {
    const name = entry.spell.definition?.name?.trim()
    if (!name) continue
    const key = `${entry.source}:${name}`
    if (!deduped.has(key)) {
      deduped.set(key, entry)
    }
  }

  return [...deduped.values()].map((entry) => entry.spell)
}

function formatSpellRange(spell: DndBeyondSpellEntry) {
  const range = spell.range ?? spell.definition?.range
  if (!range) return undefined
  if (range.origin === 'Touch') return 'Touch'
  if (range.origin === 'Self') return 'Self'
  if (typeof range.rangeValue === 'number' && range.rangeValue > 0) {
    return `${range.rangeValue} ft`
  }
  return range.origin
}

function formatSpellDuration(spell: DndBeyondSpellEntry) {
  const duration = spell.definition?.duration
  if (!duration?.durationType) return undefined
  if (duration.durationType === 'Instantaneous') return 'Instantaneous'

  const interval =
    duration.durationInterval && duration.durationUnit
      ? `${duration.durationInterval} ${duration.durationUnit.toLowerCase()}`
      : undefined

  if (duration.durationType === 'Concentration') {
    return interval ? `Concentration, up to ${interval}` : 'Concentration'
  }

  if (duration.durationType === 'Time') {
    return interval ?? 'Timed'
  }

  return duration.durationType
}

function formatSpellActivation(spell: DndBeyondSpellEntry) {
  const activation = spell.activation ?? spell.definition?.activation
  const type = ACTIVATION_TYPES[activation?.activationType ?? 0]
  if (!type) return undefined
  if (activation?.activationTime && type !== 'Special') {
    return `${activation.activationTime} ${type}`
  }
  return type
}

function formatSpellComponents(spell: DndBeyondSpellEntry) {
  const components = spell.definition?.components ?? []
  const labels = [
    components.includes(1) ? 'V' : null,
    components.includes(2) ? 'S' : null,
    components.includes(3) ? 'M' : null,
  ].filter(Boolean) as string[]

  return labels
}

function toSpells(payload: DndBeyondCharacterResponse['data']) {
  const grouped = payload?.spells
  const entries = [
    ...(grouped?.race?.map((spell) => ({ source: 'Race', spell })) ?? []),
    ...(grouped?.class?.map((spell) => ({ source: 'Class', spell })) ?? []),
    ...(grouped?.background?.map((spell) => ({ source: 'Background', spell })) ?? []),
    ...(grouped?.item?.map((spell) => ({ source: 'Item', spell })) ?? []),
    ...(grouped?.feat?.map((spell) => ({ source: 'Feat', spell })) ?? []),
    ...(grouped?.classSpells?.flatMap((group) => (group.spells ?? []).map((spell) => ({ source: 'Class', spell }))) ?? []),
    ...(payload?.classSpells?.flatMap((group) => (group.spells ?? []).map((spell) => ({ source: 'Class', spell }))) ?? []),
  ]

  const deduped = new Map<string, ReturnType<typeof mapSpellEntry>>()

  for (const entry of entries) {
    const mapped = mapSpellEntry(entry.source, entry.spell)
    if (!mapped) continue
    const key = `${mapped.source}:${mapped.name}`
    if (!deduped.has(key)) {
      deduped.set(key, mapped)
    }
  }

  return [...deduped.values()]
}

function mapSpellEntry(source: string, spell: DndBeyondSpellEntry) {
  const definition = spell.definition
  const name = definition?.name?.trim()
  if (!name) return null

  return {
    name,
    level: definition?.level ?? 0,
    source,
    school: definition?.school,
    description: definition?.description?.trim() || spell.additionalDescription?.trim() || undefined,
    concentration: Boolean(definition?.concentration),
    ritual: Boolean(definition?.ritual),
    activationType: formatSpellActivation(spell),
    castingTime: formatSpellActivation(spell),
    range: formatSpellRange(spell),
    duration: formatSpellDuration(spell),
    components: formatSpellComponents(spell),
    componentsDescription: definition?.componentsDescription?.trim() || undefined,
    tags: definition?.tags ?? [],
    prepared: Boolean(spell.prepared),
    alwaysPrepared: Boolean(spell.alwaysPrepared),
    usesSpellSlot: Boolean(spell.usesSpellSlot),
  }
}

function pushFeature(features: PlayerCharacterFeatureTrait[], entry: PlayerCharacterFeatureTrait | null) {
  if (!entry || !entry.name) return
  if (features.some((feature) => feature.name === entry.name && feature.source === entry.source)) {
    return
  }
  features.push(entry)
}

function mapNamedFeature(
  source: string,
  definition: DndBeyondNamedDescription | undefined,
  fallbackName?: string
) {
  const name = normalizeLabel(definition?.name) ?? normalizeLabel(fallbackName)
  if (!name) return null
  return {
    name,
    source,
    description: definition?.description?.trim() ?? '',
  }
}

function mapChoiceFeature(source: string, choice: DndBeyondChoice) {
  const label = normalizeLabel(choice.label)
  if (!label) return null
  const matchedOption =
    choice.options?.find((option) => normalizeLabel(option.label) === label) ??
    (choice.options?.length === 1 ? choice.options[0] : undefined)

  return {
    name: label,
    source,
    description: matchedOption?.description?.trim() ?? '',
  }
}

function toFeaturesAndTraits(payload: DndBeyondCharacterResponse['data']) {
  const features: PlayerCharacterFeatureTrait[] = []

  for (const trait of payload?.race?.racialTraits ?? []) {
    if (trait.isGranted === false) continue
    const name = trait.definition?.name?.trim()
    if (!name) continue
    pushFeature(features, {
      name,
      source: 'Race',
      description: trait.definition?.description?.trim() ?? '',
    })
  }

  for (const klass of payload?.classes ?? []) {
    for (const feature of klass.definition?.classFeatures ?? []) {
      if (typeof feature.requiredLevel === 'number' && typeof klass.level === 'number') {
        if (feature.requiredLevel > klass.level) continue
      }
      const name = feature.name?.trim()
      if (!name) continue
      pushFeature(features, {
        name,
        source: klass.definition?.name?.trim() ?? 'Class',
        description: feature.description?.trim() ?? '',
      })
    }
  }

  const background = payload?.background?.definition
  if (background?.featureName) {
    pushFeature(features, {
      name: background.featureName,
      source: 'Background',
      description: background.featureDescription?.trim() ?? '',
    })
  }

  for (const feat of background?.grantedFeats ?? []) {
    const name = feat.name?.trim()
    if (!name) continue
    pushFeature(features, {
      name,
      source: 'Feat',
      description: '',
    })
  }

  for (const feature of payload?.features ?? []) {
    pushFeature(features, mapNamedFeature('Feature', feature.definition))
  }

  for (const feat of payload?.feats ?? []) {
    pushFeature(features, mapNamedFeature('Feat', feat.definition))
  }

  const optionSources = payload?.options
  for (const [source, entries] of Object.entries(optionSources ?? {})) {
    for (const entry of entries ?? []) {
      pushFeature(features, mapNamedFeature('Option', entry.definition, `${toTitleCase(source)} Option`))
    }
  }

  const choices = payload?.choices
  for (const group of [choices?.race, choices?.class, choices?.background, choices?.item, choices?.feat]) {
    for (const choice of group ?? []) {
      pushFeature(features, mapChoiceFeature('Choice', choice))
    }
  }

  return features
}

function toInventoryItems(payload: DndBeyondCharacterResponse['data']) {
  const containerNames = new Map<string, string>()
  for (const item of payload?.inventory ?? []) {
    const name = item.definition?.name?.trim()
    if (name && item.id != null) {
      containerNames.set(String(item.id), name)
    }
  }

  return (payload?.inventory ?? [])
    .map<PlayerCharacterInventoryItem | null>((item) => {
      const name = item.definition?.name?.trim()
      if (!name) return null

      const detailParts = uniqueStrings([
        item.definition?.damage?.diceString,
        item.definition?.damageType,
        typeof item.definition?.armorClass === 'number' ? `AC ${item.definition.armorClass}` : null,
      ])

      return {
        name,
        quantity: item.quantity ?? 1,
        equipped: Boolean(item.equipped),
        isAttuned: item.isAttuned ? true : undefined,
        type: item.definition?.type,
        filterType: item.definition?.filterType ?? undefined,
        subtype: item.definition?.subType ?? undefined,
        rarity: item.definition?.rarity ?? undefined,
        attackType:
          typeof item.definition?.attackType === 'number'
            ? item.definition.attackType
            : undefined,
        weaponCategoryId:
          typeof item.definition?.categoryId === 'number'
            ? item.definition.categoryId
            : undefined,
        range:
          typeof item.definition?.range === 'number'
            ? item.definition.range
            : undefined,
        longRange:
          typeof item.definition?.longRange === 'number'
            ? item.definition.longRange
            : undefined,
        damage: item.definition?.damage?.diceString ?? undefined,
        damageType: item.definition?.damageType ?? undefined,
        description: item.definition?.description ?? undefined,
        detail: detailParts.join(' '),
        properties: uniqueStrings(
          (item.definition?.properties ?? []).map((property) =>
            property.notes ? `${property.name} (${property.notes})` : property.name
          )
        ),
        container:
          item.containerEntityId && item.containerEntityId !== payload?.id
            ? containerNames.get(String(item.containerEntityId)) ?? undefined
            : undefined,
      }
    })
    .filter((entry): entry is PlayerCharacterInventoryItem => Boolean(entry))
}

function splitDescriptionList(value: string | undefined) {
  if (!value) return []
  return uniqueStrings(
    value
      .replace(/<[^>]+>/g, ' ')
      .split(/,|\band\b|\bor\b/)
      .map((part) => part.trim())
      .filter((part) => part.length > 1)
  )
}

function toBackground(payload: DndBeyondCharacterResponse['data']) {
  const definition = payload?.background?.definition
  if (!definition?.name) return null

  return {
    name: definition.name,
    description: definition.shortDescription?.trim() ?? definition.description?.trim() ?? '',
    featureName: definition.featureName?.trim(),
    featureDescription: definition.featureDescription?.trim(),
    proficiencies: splitDescriptionList(definition.skillProficienciesDescription),
    tools: splitDescriptionList(definition.toolProficienciesDescription),
    equipment: splitDescriptionList(definition.equipmentDescription),
    feats: uniqueStrings((definition.grantedFeats ?? []).map((feat) => feat.name)),
  }
}

function toNotes(payload: DndBeyondCharacterResponse['data']) {
  const notes = payload?.notes
  const traits = payload?.traits
  const result = {
    allies: notes?.allies ?? undefined,
    enemies: notes?.enemies ?? undefined,
    organizations: notes?.organizations ?? undefined,
    backstory: notes?.backstory ?? undefined,
    personalPossessions: notes?.personalPossessions ?? undefined,
    otherHoldings: notes?.otherHoldings ?? undefined,
    otherNotes: notes?.otherNotes ?? undefined,
    personalityTraits: traits?.personalityTraits ?? undefined,
    ideals: traits?.ideals ?? undefined,
    bonds: traits?.bonds ?? undefined,
    flaws: traits?.flaws ?? undefined,
    appearance: traits?.appearance ?? undefined,
  }

  return Object.values(result).some(Boolean) ? result : null
}

function toExtra(payload: DndBeyondCharacterResponse['data']) {
  const result = {
    gender: payload?.gender ?? undefined,
    age: payload?.age != null ? String(payload.age) : undefined,
    faith: payload?.faith ?? undefined,
    hair: payload?.hair ?? undefined,
    eyes: payload?.eyes ?? undefined,
    skin: payload?.skin ?? undefined,
    height: payload?.height ?? undefined,
    weight: payload?.weight != null ? String(payload.weight) : undefined,
    alignment:
      payload?.alignmentId != null ? ALIGNMENT_LABELS[payload.alignmentId] ?? undefined : undefined,
    lifestyle: payload?.lifestyle?.name ?? undefined,
    inspiration: payload?.inspiration != null ? (payload.inspiration ? 'Yes' : 'No') : undefined,
    cp: payload?.currencies?.cp ?? undefined,
    sp: payload?.currencies?.sp ?? undefined,
    gp: payload?.currencies?.gp ?? undefined,
    ep: payload?.currencies?.ep ?? undefined,
    pp: payload?.currencies?.pp ?? undefined,
  }

  return Object.values(result).some((value) => value !== undefined && value !== null && value !== '')
    ? result
    : null
}

function toDefense(
  payload: DndBeyondCharacterResponse['data'],
  maxHp: number,
  speed: number,
  currentHp: number
) {
  const modifierList = flattenModifiers(payload?.modifiers)

  return {
    armorClass: payload?.armorClass ?? 10,
    maxHp,
    currentHp,
    tempHp: payload?.temporaryHitPoints ?? 0,
    speed,
    resistances: uniqueStrings(
      modifierList
        .filter((modifier) => modifier.type === 'resistance')
        .map((modifier) => modifier.friendlySubtypeName ?? toTitleCase(modifier.subType ?? ''))
    ),
    immunities: uniqueStrings(
      modifierList
        .filter((modifier) => modifier.type === 'immunity')
        .map((modifier) => modifier.friendlySubtypeName ?? toTitleCase(modifier.subType ?? ''))
    ),
    advantages: uniqueStrings(
      modifierList
        .filter((modifier) => modifier.type === 'advantage')
        .map((modifier) =>
          modifier.restriction
            ? `${modifier.friendlySubtypeName ?? toTitleCase(modifier.subType ?? '')}: ${modifier.restriction}`
            : modifier.friendlySubtypeName ?? toTitleCase(modifier.subType ?? '')
        )
    ),
  }
}

function toMaxHp(payload: DndBeyondCharacterResponse['data']) {
  if (typeof payload?.overrideHitPoints === 'number') {
    return payload.overrideHitPoints
  }
  return (payload?.baseHitPoints ?? 0) + (payload?.bonusHitPoints ?? 0)
}

function toCurrentHp(payload: DndBeyondCharacterResponse['data'], maxHp: number) {
  if (typeof payload?.currentHitPoints === 'number') {
    return payload.currentHitPoints
  }
  if (typeof payload?.removedHitPoints === 'number') {
    return Math.max(0, maxHp - payload.removedHitPoints)
  }
  return maxHp
}

function abilityToWord(ability: AbilityKey) {
  switch (ability) {
    case 'str':
      return 'strength'
    case 'dex':
      return 'dexterity'
    case 'con':
      return 'constitution'
    case 'int':
      return 'intelligence'
    case 'wis':
      return 'wisdom'
    case 'cha':
      return 'charisma'
  }
}

export function extractDndBeyondCharacterId(url: string) {
  const match = url.trim().match(/dndbeyond\.com\/(?:profile\/[^/]+\/)?characters\/(\d+)/i)
  if (!match?.[1]) {
    throw new Error('Paste a valid D&D Beyond character URL.')
  }

  return match[1]
}

export function buildClassSummary(classes: DndBeyondClass[] | undefined) {
  const summary = (classes ?? [])
    .map((entry) => {
      const name = entry.definition?.name?.trim()
      const level = entry.level ?? 0
      if (!name) {
        return null
      }

      return `${name} ${level}`
    })
    .filter((entry): entry is string => Boolean(entry))

  return summary.join(' / ')
}

export function mapDndBeyondCharacter({
  campaignId,
  sourceUrl,
  importSource,
  importFileName,
  payload,
}: NormalizedPlayerCharacterInput) {
  const data = payload.data
  if (!data?.id || !data.name) {
    throw new Error('Could not read that D&D Beyond character.')
  }

  const classes = data.classes ?? []
  const totalLevel = classes.reduce((sum, entry) => sum + (entry.level ?? 0), 0)
  const proficiencyBonus = Math.ceil(Math.max(totalLevel, 1) / 4) + 1
  const maxHp = toMaxHp(data)
  const abilityScores =
    data.stats && data.stats.length >= 6 ? toAbilityScores(data.stats) : emptyAbilityScores
  const speed = toSpeed(data)
  const currentHp = toCurrentHp(data, maxHp)
  const sheet = createEmptyPlayerCharacterSheet()

  sheet.proficiencyBonus = proficiencyBonus
  sheet.speed = toSpeedEntries(data)
  sheet.senses = mergeSenses(data)
  sheet.savingThrows = toSavingThrows(abilityScores, data.modifiers, proficiencyBonus)
  sheet.skills = toSkills(abilityScores, data.modifiers, proficiencyBonus)
  sheet.proficienciesAndTraining = toProficienciesAndTraining(data.modifiers)
  sheet.actions = toActions(data.actions)
  sheet.spells = toSpells(data)
  sheet.featuresAndTraits = toFeaturesAndTraits(data)
  sheet.inventory = toInventoryItems(data)
  sheet.background = toBackground(data)
  sheet.notes = toNotes(data)
  sheet.extra = toExtra(data)
  sheet.defense = toDefense(data, maxHp, speed, currentHp)

  return {
    campaignId,
    dndBeyondCharacterId: String(data.id),
    sourceUrl,
    importSource: importSource ?? 'dndbeyond-url',
    importFileName: importFileName ?? null,
    name: data.name,
    race: data.race?.fullName ?? data.race?.baseName ?? 'Unknown',
    classSummary: buildClassSummary(classes),
    level: totalLevel,
    armorClass: data.armorClass ?? 10,
    initiative: data.initiative ?? 0,
    speed,
    currentHp,
    maxHp,
    tempHp: data.temporaryHitPoints ?? 0,
    abilityScores,
    inventorySummary: toInventorySummary(data.inventory).slice(0, 8),
    spellSummary: toSpellSummary(data).slice(0, 12),
    sheet,
    lastSyncedAt: new Date().toISOString(),
  }
}

export async function requestDndBeyondCharacter(
  characterId: string,
  options?: { fetchImpl?: typeof fetch }
) {
  const fetchImpl = options?.fetchImpl ?? fetch
  const response = await fetchImpl(`${DND_BEYOND_API_BASE}/${characterId}`, {
    headers: {
      accept: 'application/json',
    },
  })

  if (response.status === 403 || response.status === 404) {
    throw new Error('Character must be public to import from a URL.')
  }

  if (!response.ok) {
    throw new Error(`D&D Beyond request failed with status ${response.status}.`)
  }

  return (await response.json()) as DndBeyondCharacterResponse
}
