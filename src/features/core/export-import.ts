import { migrateState } from './migrations'
import { appRepository } from './repository'

export type ImportResult =
  | { ok: true }
  | { ok: false; error: string }

export function exportState(): string {
  return JSON.stringify(appRepository.getState(), null, 2)
}

export function importState(raw: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return { ok: false, error: `Could not parse JSON: ${(error as Error).message}` }
  }

  const migrated = migrateState(parsed)

  if (!Array.isArray(migrated.campaigns)) {
    return { ok: false, error: 'Invalid app state: campaigns is missing.' }
  }

  appRepository.saveState(migrated)
  return { ok: true }
}
