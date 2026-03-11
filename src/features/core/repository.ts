import { currentVersion, safeParseState, seedableState } from './migrations'
import { localStorageAdapter } from './storage'
import type {
  AppState,
  BaseEntity,
  CollectionKey,
  EntityByCollection,
  EntityId,
  ListFilters,
  Repository,
  SourceType,
} from './types'

const STORAGE_KEY = 'dnd-db.v1'

const listeners = new Set<() => void>()

function nowIso() {
  return new Date().toISOString()
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function cloneState(state: AppState): AppState {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(state)
  }

  return JSON.parse(JSON.stringify(state)) as AppState
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function loadState(): AppState {
  const raw = localStorageAdapter.getItem(STORAGE_KEY)
  return safeParseState(raw)
}

let appState: AppState = loadState()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function getMostRecentlyUpdatedCampaignId(state: AppState): EntityId | null {
  const sorted = [...state.campaigns].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return sorted[0]?.id ?? null
}

function resolveActiveCampaignId(state: AppState): EntityId | null {
  if (state.activeCampaignId && state.campaigns.some((campaign) => campaign.id === state.activeCampaignId)) {
    return state.activeCampaignId
  }

  return getMostRecentlyUpdatedCampaignId(state)
}

function toCollectionArray<K extends CollectionKey>(collection: K): EntityByCollection[K][] {
  return appState[collection] as EntityByCollection[K][]
}

function hasEntity<K extends CollectionKey>(collection: K, id: EntityId): boolean {
  return toCollectionArray(collection).some((entry) => entry.id === id)
}

function routeSourceStillExists(sourceType: SourceType, sourceId: EntityId): boolean {
  if (!sourceId) {
    return false
  }

  switch (sourceType) {
    case 'note':
      return hasEntity('notes', sourceId)
    case 'npc':
      return hasEntity('npcs', sourceId)
    case 'timeline':
      return hasEntity('timelineEvents', sourceId)
    case 'lookup':
      return hasEntity('lookupEntries', sourceId)
    case 'map':
      return hasEntity('maps', sourceId)
    default:
      return false
  }
}

function cleanupRelations(next: AppState): AppState {
  const pinIds = new Set(next.pins.map((pin) => pin.id))
  const mapIds = new Set(next.maps.map((map) => map.id))
  const mapDocumentIds = new Set(next.mapDocuments.map((map) => map.id))
  const timelineIds = new Set(next.timelineEvents.map((event) => event.id))
  const noteIds = new Set(next.notes.map((note) => note.id))
  const npcIds = new Set(next.npcs.map((npc) => npc.id))

  next.notes = next.notes.map((note) => ({
    ...note,
    linkedPinIds: note.linkedPinIds.filter((id) => pinIds.has(id)),
  }))

  next.maps = next.maps.map((map) => ({
    ...map,
    usedNpcIds: map.usedNpcIds.filter((id) => npcIds.has(id)),
    linkedPinIds: map.linkedPinIds.filter((id) => pinIds.has(id)),
  }))

  next.mapDocuments = next.mapDocuments.map((map) => ({
    ...map,
    summaryMapId: map.summaryMapId && mapIds.has(map.summaryMapId) ? map.summaryMapId : null,
    parentMapId: map.parentMapId && mapDocumentIds.has(map.parentMapId) ? map.parentMapId : null,
    childMapIdsByHex: Object.fromEntries(
      Object.entries(map.childMapIdsByHex).filter(([, childId]) => mapDocumentIds.has(childId))
    ),
    features: map.features.map((feature) => ({
      ...feature,
      linkedNpcIds: feature.linkedNpcIds.filter((id) => npcIds.has(id)),
      linkedPinIds: feature.linkedPinIds.filter((id) => pinIds.has(id)),
    })),
  }))

  next.npcs = next.npcs.map((npc) => ({
    ...npc,
    usedInMapIds: npc.usedInMapIds.filter((id) => mapIds.has(id)),
    usedInTimelineEventIds: npc.usedInTimelineEventIds.filter((id) => timelineIds.has(id)),
  }))

  next.timelineEvents = next.timelineEvents.map((event) => ({
    ...event,
    relatedNpcIds: event.relatedNpcIds.filter((id) => npcIds.has(id)),
    relatedNoteIds: event.relatedNoteIds.filter((id) => noteIds.has(id)),
  }))

  next.pins = next.pins.filter((pin) => routeSourceStillExists(pin.sourceType, pin.sourceId))

  const currentEvents = next.timelineEvents.filter((event) => event.isCurrent)
  if (currentEvents.length > 1) {
    const [first, ...rest] = currentEvents
    next.timelineEvents = next.timelineEvents.map((event) => {
      if (event.id === first.id) {
        return event
      }

      if (rest.some((item) => item.id === event.id)) {
        return { ...event, isCurrent: false }
      }

      return event
    })
  }

  return next
}

function persistState(next: AppState) {
  const sanitized = cleanupRelations(next)
  sanitized.activeCampaignId = resolveActiveCampaignId(sanitized)
  appState = sanitized
  localStorageAdapter.setItem(STORAGE_KEY, JSON.stringify(appState))
  emitChange()
}

function applyFilters<T extends BaseEntity>(items: T[], filters?: ListFilters<T>): T[] {
  if (!filters) {
    return items
  }

  const search = filters.search?.trim().toLowerCase()

  return items.filter((item) => {
    if (filters.campaignId && item.campaignId !== filters.campaignId) {
      return false
    }

    if (search) {
      const haystack = JSON.stringify(item).toLowerCase()
      if (!haystack.includes(search)) {
        return false
      }
    }

    if (filters.predicate && !filters.predicate(item)) {
      return false
    }

    return true
  })
}

export const appRepository: Repository = {
  getState() {
    // useSyncExternalStore requires stable snapshot identity between changes.
    // Returning a cloned object on each read can trigger infinite render loops.
    return appState
  },
  saveState(nextState) {
    const snapshot = cloneState(nextState)
    snapshot.version = currentVersion
    persistState(snapshot)
  },
  setActiveCampaign(campaignId) {
    if (appState.activeCampaignId === campaignId) {
      return
    }

    const nextState = cloneState(appState)
    nextState.activeCampaignId = campaignId
    persistState(nextState)
  },
  getActiveCampaignId() {
    return resolveActiveCampaignId(appState)
  },
  deleteCampaignCascade(campaignId) {
    if (!appState.campaigns.some((campaign) => campaign.id === campaignId)) {
      return false
    }

    const nextState = cloneState(appState)
    nextState.campaigns = nextState.campaigns.filter((campaign) => campaign.id !== campaignId)
    nextState.notes = nextState.notes.filter((note) => note.campaignId !== campaignId)
    nextState.pins = nextState.pins.filter((pin) => pin.campaignId !== campaignId)
    nextState.maps = nextState.maps.filter((map) => map.campaignId !== campaignId)
    nextState.mapDocuments = nextState.mapDocuments.filter((map) => map.campaignId !== campaignId)
    nextState.npcs = nextState.npcs.filter((npc) => npc.campaignId !== campaignId)
    nextState.playerCharacters = nextState.playerCharacters.filter(
      (character) => character.campaignId !== campaignId
    )
    nextState.timelineEvents = nextState.timelineEvents.filter((event) => event.campaignId !== campaignId)
    nextState.lookupEntries = nextState.lookupEntries.filter((entry) => entry.campaignId !== campaignId)

    if (nextState.activeCampaignId === campaignId) {
      nextState.activeCampaignId = getMostRecentlyUpdatedCampaignId(nextState)
    }

    persistState(nextState)
    return true
  },
  list(collection, filters) {
    const source = toCollectionArray(collection)
    const filtered = applyFilters(source, filters as ListFilters<BaseEntity> | undefined)
    return cloneValue(filtered) as EntityByCollection[typeof collection][]
  },
  create(collection, payload) {
    const collectionEntries = toCollectionArray(collection)
    const timestamp = nowIso()

    const nextEntity = {
      ...payload,
      id: payload.id ?? generateId(collection),
      createdAt: payload.createdAt ?? timestamp,
      updatedAt: timestamp,
    } as EntityByCollection[typeof collection]

    if (collectionEntries.some((entry) => entry.id === nextEntity.id)) {
      return collectionEntries.find((entry) => entry.id === nextEntity.id) as EntityByCollection[typeof collection]
    }

    const nextState = cloneState(appState)
    ;(nextState[collection] as EntityByCollection[typeof collection][]).push(nextEntity)

    if (collection === 'campaigns' && !nextState.activeCampaignId) {
      nextState.activeCampaignId = nextEntity.id
    }

    if (collection === 'timelineEvents' && (nextEntity as EntityByCollection['timelineEvents']).isCurrent) {
      nextState.timelineEvents = nextState.timelineEvents.map((event) =>
        event.id === nextEntity.id ? event : { ...event, isCurrent: false }
      )
    }

    persistState(nextState)

    return cloneValue(nextEntity)
  },
  update(collection, id, patch) {
    const nextState = cloneState(appState)
    const records = nextState[collection] as EntityByCollection[typeof collection][]
    const index = records.findIndex((entry) => entry.id === id)

    if (index < 0) {
      return null
    }

    const updated = {
      ...records[index],
      ...patch,
      updatedAt: nowIso(),
    } as EntityByCollection[typeof collection]

    records[index] = updated

    if (collection === 'timelineEvents' && (updated as EntityByCollection['timelineEvents']).isCurrent) {
      nextState.timelineEvents = nextState.timelineEvents.map((event) =>
        event.id === id ? event : { ...event, isCurrent: false }
      )
    }

    persistState(nextState)

    return cloneValue(updated)
  },
  delete(collection, id) {
    if (collection === 'campaigns') {
      return appRepository.deleteCampaignCascade(id)
    }

    const nextState = cloneState(appState)
    const records = nextState[collection] as EntityByCollection[typeof collection][]
    const nextRecords = records.filter((entry) => entry.id !== id)

    if (nextRecords.length === records.length) {
      return false
    }

    nextState[collection] = nextRecords as AppState[typeof collection]
    persistState(nextState)

    return true
  },
  seedIfEmpty() {
    const seeded = seedableState(cloneState(appState))
    if (seeded.campaigns.length !== appState.campaigns.length) {
      persistState(seeded)
    }
  },
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function resetRepositoryStateForTests(state: AppState) {
  appState = cloneState(state)
  localStorageAdapter.removeItem(STORAGE_KEY)
}
