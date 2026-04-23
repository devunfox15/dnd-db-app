import { createEmptyPlayerCharacterSheet } from './player-character-sheet'
import { createSampleState } from './sample-data'
import type { AppState, MapFeature, PlayerCharacterImportSource } from './types'

export const currentVersion = 7

function normalizeMapKind(kind: unknown): 'world' | 'session' {
  return kind === 'session' ? 'session' : 'world'
}

function normalizeMapFeature(input: unknown): MapFeature {
  const feature = input as Partial<MapFeature>
  return {
    ...feature,
    kind:
      feature.kind === 'location-pin' ||
      feature.kind === 'settlement' ||
      feature.kind === 'landmark' ||
      feature.kind === 'dungeon' ||
      feature.kind === 'resource' ||
      feature.kind === 'magical-anomaly' ||
      feature.kind === 'river' ||
      feature.kind === 'road' ||
      feature.kind === 'border'
        ? feature.kind
        : 'landmark',
    linkedMapDocumentId:
      typeof feature.linkedMapDocumentId === 'string'
        ? feature.linkedMapDocumentId
        : null,
  } as MapFeature
}

export function createEmptyState(): AppState {
  return {
    version: currentVersion,
    activeCampaignId: null,
    campaigns: [],
    notes: [],
    pins: [],
    maps: [],
    mapDocuments: [],
    npcs: [],
    playerCharacters: [],
    timelineEvents: [],
    lookupEntries: [],
    sessionLog: [],
  }
}

export function migrateState(input: unknown): AppState {
  if (!input || typeof input !== 'object') {
    return createEmptyState()
  }

  const raw = input as Record<string, unknown>
  const hasLegacyShape =
    'version' in raw &&
    'campaigns' in raw &&
    'notes' in raw &&
    'pins' in raw &&
    'maps' in raw &&
    'mapDocuments' in raw &&
    'npcs' in raw &&
    'playerCharacters' in raw &&
    'timelineEvents' in raw &&
    'lookupEntries' in raw

  const hasV1LegacyShape =
    'version' in raw &&
    'campaigns' in raw &&
    'notes' in raw &&
    'pins' in raw &&
    'maps' in raw &&
    'npcs' in raw &&
    'timelineEvents' in raw &&
    'lookupEntries' in raw

  if (!hasLegacyShape && !hasV1LegacyShape) {
    return createEmptyState()
  }

  const migrated = {
    ...createEmptyState(),
    ...raw,
    version: currentVersion,
  } as AppState

  if (!Array.isArray(migrated.campaigns)) {
    return createEmptyState()
  }

  migrated.campaigns = migrated.campaigns.map((campaign) => ({
    ...campaign,
    rpgSystem: campaign.rpgSystem ?? 'dnd-5e',
  }))

  migrated.maps = Array.isArray(migrated.maps)
    ? migrated.maps.map((map) => ({
        ...map,
        kind: normalizeMapKind(map.kind),
      }))
    : []

  migrated.playerCharacters = Array.isArray(migrated.playerCharacters)
    ? migrated.playerCharacters.map((character) => ({
        ...character,
        importSource: ((importSource) =>
          importSource === 'json-upload' || importSource === 'manual-capture'
            ? 'dndbeyond-url'
            : importSource ?? 'dndbeyond-url')(
          character.importSource as PlayerCharacterImportSource | 'json-upload' | 'manual-capture' | undefined,
        ),
        importFileName: character.importFileName ?? null,
        sheet: character.sheet ?? createEmptyPlayerCharacterSheet(),
      }))
    : []

  migrated.mapDocuments = Array.isArray(migrated.mapDocuments)
    ? migrated.mapDocuments.map((document) => ({
        ...document,
        kind: normalizeMapKind(document.kind),
        labels: Array.isArray(document.labels) ? document.labels : [],
        features: Array.isArray(document.features)
          ? document.features.map((feature) => normalizeMapFeature(feature))
          : [],
      }))
    : []

  migrated.sessionLog = Array.isArray(migrated.sessionLog) ? migrated.sessionLog : []
  delete (migrated as AppState & { locations?: unknown }).locations

  const validActiveCampaignId =
    typeof migrated.activeCampaignId === 'string' &&
    migrated.campaigns.some((campaign) => campaign.id === migrated.activeCampaignId)
      ? migrated.activeCampaignId
      : null

  migrated.activeCampaignId = validActiveCampaignId ?? migrated.campaigns[0]?.id ?? null

  return migrated
}

export function safeParseState(rawValue: string | null): AppState {
  if (!rawValue) {
    return createEmptyState()
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown
    return migrateState(parsed)
  } catch {
    return createEmptyState()
  }
}

export function seedableState(state: AppState): AppState {
  if (state.campaigns.length > 0) {
    return state
  }

  return createSampleState(currentVersion)
}
