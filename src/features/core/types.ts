export type EntityId = string

export type SourceType = 'note' | 'npc' | 'timeline' | 'lookup' | 'map'
export type CampaignRpgSystem =
  | 'dnd-5e'
  | 'pathfinder-2e'
  | 'call-of-cthulhu-7e'
  | 'cyberpunk-red'

export type PinStatus = 'active' | 'resolved' | 'backlog'
export type TimelineStatus = 'planned' | 'active' | 'completed'

export interface BaseEntity {
  id: EntityId
  createdAt: string
  updatedAt: string
  campaignId: EntityId
  tags?: string[]
}

export interface Campaign extends BaseEntity {
  name: string
  description: string
  rpgSystem: CampaignRpgSystem
}

export interface DmNote extends BaseEntity {
  title: string
  body: string
  area: string
  linkedPinIds: EntityId[]
}

export interface StoryPin extends BaseEntity {
  title: string
  summary: string
  status: PinStatus
  sourceType: SourceType
  sourceId: EntityId
}

export interface MapRecord extends BaseEntity {
  name: string
  region: string
  description: string
  imageUrl: string
  usedNpcIds: EntityId[]
  linkedPinIds: EntityId[]
  usedInStory: boolean
}

export interface NpcCharacter extends BaseEntity {
  name: string
  role: string
  faction: string
  notes: string
  usedInMapIds: EntityId[]
  usedInTimelineEventIds: EntityId[]
}

export interface TimelineEvent extends BaseEntity {
  title: string
  details: string
  sessionNumber: number
  orderIndex: number
  status: TimelineStatus
  isCurrent: boolean
  relatedNpcIds: EntityId[]
  relatedNoteIds: EntityId[]
}

export interface LookupEntry extends BaseEntity {
  title: string
  category: string
  summary: string
  details: string
}

export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export type AbilityKey = keyof AbilityScores

export interface PlayerCharacterLabeledValue {
  label: string
  value: string
}

export interface PlayerCharacterSavingThrow {
  ability: AbilityKey
  label: string
  value: number
  proficient: boolean
}

export interface PlayerCharacterSkill {
  key: string
  label: string
  ability: AbilityKey
  value: number
  proficient: boolean
}

export interface PlayerCharacterProficienciesAndTraining {
  languages: string[]
  armor: string[]
  weapons: string[]
  tools: string[]
  other: string[]
}

export interface PlayerCharacterAction {
  name: string
  description: string
  activationType?: string
  range?: string
  damage?: string
}

export interface PlayerCharacterSpell {
  name: string
  level: number
  source: string
  school?: string
  description?: string
  concentration?: boolean
  ritual?: boolean
  activationType?: string
  castingTime?: string
  range?: string
  duration?: string
  components?: string[]
  componentsDescription?: string
  tags?: string[]
  prepared?: boolean
  alwaysPrepared?: boolean
  usesSpellSlot?: boolean
}

export interface PlayerCharacterFeatureTrait {
  name: string
  source: string
  description: string
}

export interface PlayerCharacterInventoryItem {
  name: string
  quantity: number
  equipped: boolean
  type?: string
  detail?: string
  container?: string
}

export interface PlayerCharacterBackgroundDetail {
  name: string
  description: string
  featureName?: string
  featureDescription?: string
  proficiencies: string[]
  tools: string[]
  equipment: string[]
  feats: string[]
}

export interface PlayerCharacterNotesDetail {
  allies?: string
  enemies?: string
  organizations?: string
  backstory?: string
  personalPossessions?: string
  otherHoldings?: string
  otherNotes?: string
  personalityTraits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  appearance?: string
}

export interface PlayerCharacterExtraDetail {
  gender?: string
  age?: string
  faith?: string
  hair?: string
  eyes?: string
  skin?: string
  height?: string
  weight?: string
  alignment?: string
  lifestyle?: string
  inspiration?: string
  cp?: number
  sp?: number
  gp?: number
  ep?: number
  pp?: number
}

export interface PlayerCharacterDefenseDetail {
  armorClass: number
  maxHp: number
  currentHp: number
  tempHp: number
  speed: number
  resistances: string[]
  immunities: string[]
  advantages: string[]
}

export interface PlayerCharacterSheet {
  proficiencyBonus: number
  speed: PlayerCharacterLabeledValue[]
  senses: PlayerCharacterLabeledValue[]
  savingThrows: PlayerCharacterSavingThrow[]
  skills: PlayerCharacterSkill[]
  proficienciesAndTraining: PlayerCharacterProficienciesAndTraining
  actions: PlayerCharacterAction[]
  spells: PlayerCharacterSpell[]
  featuresAndTraits: PlayerCharacterFeatureTrait[]
  inventory: PlayerCharacterInventoryItem[]
  background: PlayerCharacterBackgroundDetail | null
  notes: PlayerCharacterNotesDetail | null
  extra: PlayerCharacterExtraDetail | null
  defense: PlayerCharacterDefenseDetail
}

export type PlayerCharacterImportStatus = 'ready' | 'error' | 'syncing'
export type PlayerCharacterImportSource = 'dndbeyond-url'

export interface PlayerCharacter extends BaseEntity {
  dndBeyondCharacterId: string
  sourceUrl: string
  importSource: PlayerCharacterImportSource
  importFileName: string | null
  name: string
  race: string
  classSummary: string
  level: number
  armorClass: number
  initiative: number
  speed: number
  currentHp: number
  maxHp: number
  tempHp: number
  abilityScores: AbilityScores
  conditions: string[]
  concentration: boolean
  inventorySummary: string[]
  spellSummary: string[]
  sheet: PlayerCharacterSheet
  quickNotes: string
  lastSyncedAt: string | null
  importStatus: PlayerCharacterImportStatus
  importError: string | null
}

export interface AppState {
  version: number
  activeCampaignId: EntityId | null
  campaigns: Campaign[]
  notes: DmNote[]
  pins: StoryPin[]
  maps: MapRecord[]
  npcs: NpcCharacter[]
  playerCharacters: PlayerCharacter[]
  timelineEvents: TimelineEvent[]
  lookupEntries: LookupEntry[]
}

export type CollectionKey = keyof EntityByCollection

export type EntityByCollection = {
  campaigns: Campaign
  notes: DmNote
  pins: StoryPin
  maps: MapRecord
  npcs: NpcCharacter
  playerCharacters: PlayerCharacter
  timelineEvents: TimelineEvent
  lookupEntries: LookupEntry
}

export interface ListFilters<T extends BaseEntity> {
  campaignId?: EntityId
  search?: string
  predicate?: (entity: T) => boolean
}

export interface StorageAdapter {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export interface Repository {
  getState: () => AppState
  saveState: (nextState: AppState) => void
  setActiveCampaign: (campaignId: EntityId | null) => void
  getActiveCampaignId: () => EntityId | null
  deleteCampaignCascade: (campaignId: EntityId) => boolean
  list: <K extends CollectionKey>(collection: K, filters?: ListFilters<EntityByCollection[K]>) => EntityByCollection[K][]
  create: <K extends CollectionKey>(collection: K, payload: Omit<EntityByCollection[K], 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<EntityByCollection[K], 'id' | 'createdAt' | 'updatedAt'>>) => EntityByCollection[K]
  update: <K extends CollectionKey>(collection: K, id: EntityId, patch: Partial<EntityByCollection[K]>) => EntityByCollection[K] | null
  delete: <K extends CollectionKey>(collection: K, id: EntityId) => boolean
  seedIfEmpty: () => void
  subscribe: (listener: () => void) => () => void
}
