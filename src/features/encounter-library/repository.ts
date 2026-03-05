import { localStorageAdapter } from '@/features/core/storage'
import type {
  EncounterEnemy,
  EncounterLibraryState,
  EncounterTemplate,
} from '@/features/encounter-library/types'

const STORAGE_KEY = 'dnd-db.encounter-library.v1'

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

function sanitizeEnemy(value: unknown): EncounterEnemy | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const item = value as Partial<EncounterEnemy>
  if (!item.id || !item.name) {
    return null
  }

  return {
    id: item.id,
    name: item.name,
    hp: Number.isFinite(item.hp) ? Math.max(1, Math.floor(item.hp as number)) : 1,
    initiative: Number.isFinite(item.initiative)
      ? Math.max(0, Math.floor(item.initiative as number))
      : 0,
    status: typeof item.status === 'string' ? item.status : '',
  }
}

function sanitizeTemplate(value: unknown): EncounterTemplate | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const item = value as Partial<EncounterTemplate>
  if (!item.id || !item.campaignId || !item.name) {
    return null
  }

  const enemies = Array.isArray(item.enemies)
    ? item.enemies
        .map((enemy) => sanitizeEnemy(enemy))
        .filter((enemy): enemy is EncounterEnemy => Boolean(enemy))
    : []

  return {
    id: item.id,
    campaignId: item.campaignId,
    name: item.name,
    terrain: typeof item.terrain === 'string' ? item.terrain : '',
    notes: typeof item.notes === 'string' ? item.notes : '',
    enemies,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : nowIso(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : nowIso(),
  }
}

function sanitizeState(value: unknown): EncounterLibraryState {
  if (!value || typeof value !== 'object') {
    return { byCampaign: {} }
  }

  const raw = value as Partial<EncounterLibraryState>
  const byCampaign: Record<string, EncounterTemplate[]> = {}

  if (!raw.byCampaign || typeof raw.byCampaign !== 'object') {
    return { byCampaign }
  }

  for (const [campaignId, entries] of Object.entries(raw.byCampaign)) {
    if (!Array.isArray(entries)) {
      continue
    }

    const templates = entries
      .map((item) => sanitizeTemplate(item))
      .filter((item): item is EncounterTemplate => Boolean(item))

    if (templates.length > 0) {
      byCampaign[campaignId] = templates
    }
  }

  return { byCampaign }
}

function loadState(): EncounterLibraryState {
  const raw = localStorageAdapter.getItem(STORAGE_KEY)
  if (!raw) {
    return { byCampaign: {} }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return sanitizeState(parsed)
  } catch {
    return { byCampaign: {} }
  }
}

let encounterLibraryState: EncounterLibraryState = loadState()

function saveState(next: EncounterLibraryState) {
  encounterLibraryState = sanitizeState(next)
  localStorageAdapter.setItem(STORAGE_KEY, JSON.stringify(encounterLibraryState))
  for (const listener of listeners) {
    listener()
  }
}

export const encounterLibraryRepository = {
  getState() {
    return encounterLibraryState
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  list(campaignId: string): EncounterTemplate[] {
    const templates = encounterLibraryState.byCampaign[campaignId] ?? []
    return [...templates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  create(
    campaignId: string,
    payload: Pick<EncounterTemplate, 'name' | 'terrain' | 'notes' | 'enemies'>,
  ): EncounterTemplate {
    const now = nowIso()
    const next: EncounterTemplate = {
      id: generateId('encounter-template'),
      campaignId,
      name: payload.name.trim() || 'Untitled Encounter',
      terrain: payload.terrain,
      notes: payload.notes,
      enemies: payload.enemies,
      createdAt: now,
      updatedAt: now,
    }

    const campaignEntries = encounterLibraryState.byCampaign[campaignId] ?? []
    saveState({
      byCampaign: {
        ...encounterLibraryState.byCampaign,
        [campaignId]: [...campaignEntries, next],
      },
    })

    return next
  },
  update(id: string, patch: Partial<EncounterTemplate>): EncounterTemplate | null {
    let updatedTemplate: EncounterTemplate | null = null
    const nextByCampaign: Record<string, EncounterTemplate[]> = {}

    for (const [campaignId, entries] of Object.entries(
      encounterLibraryState.byCampaign,
    )) {
      nextByCampaign[campaignId] = entries.map((entry) => {
        if (entry.id !== id) {
          return entry
        }

        updatedTemplate = {
          ...entry,
          ...patch,
          id: entry.id,
          campaignId: entry.campaignId,
          updatedAt: nowIso(),
        }

        return updatedTemplate
      })
    }

    if (!updatedTemplate) {
      return null
    }

    saveState({ byCampaign: nextByCampaign })
    return updatedTemplate
  },
  delete(id: string): boolean {
    let changed = false
    const nextByCampaign: Record<string, EncounterTemplate[]> = {}

    for (const [campaignId, entries] of Object.entries(
      encounterLibraryState.byCampaign,
    )) {
      const nextEntries = entries.filter((entry) => entry.id !== id)
      if (nextEntries.length !== entries.length) {
        changed = true
      }
      nextByCampaign[campaignId] = nextEntries
    }

    if (!changed) {
      return false
    }

    saveState({ byCampaign: nextByCampaign })
    return true
  },
}

export function resetEncounterLibraryStateForTests() {
  localStorageAdapter.removeItem(STORAGE_KEY)
  encounterLibraryState = { byCampaign: {} }
  for (const listener of listeners) {
    listener()
  }
}
