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

export interface AppState {
  version: number
  activeCampaignId: EntityId | null
  campaigns: Campaign[]
  notes: DmNote[]
  pins: StoryPin[]
  maps: MapRecord[]
  npcs: NpcCharacter[]
  timelineEvents: TimelineEvent[]
  lookupEntries: LookupEntry[]
}

export type CollectionKey = Exclude<keyof AppState, 'version'>

export type EntityByCollection = {
  campaigns: Campaign
  notes: DmNote
  pins: StoryPin
  maps: MapRecord
  npcs: NpcCharacter
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
