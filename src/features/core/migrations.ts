import { createSampleState } from './sample-data'
import type { AppState } from './types'

export const currentVersion = 2

export function createEmptyState(): AppState {
  return {
    version: currentVersion,
    activeCampaignId: null,
    campaigns: [],
    notes: [],
    pins: [],
    maps: [],
    npcs: [],
    timelineEvents: [],
    lookupEntries: [],
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
    'npcs' in raw &&
    'timelineEvents' in raw &&
    'lookupEntries' in raw

  if (!hasLegacyShape) {
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
