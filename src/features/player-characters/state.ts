import type { PlayerCharacter } from '@/features/core/types'
import type { ImportedPlayerCharacter } from '@/features/player-characters/types'

export function buildImportedPlayerCharacter(
  imported: ImportedPlayerCharacter
): Omit<PlayerCharacter, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...imported,
    currentHp: imported.currentHp,
    tempHp: imported.tempHp,
    conditions: [],
    concentration: false,
    quickNotes: '',
    importStatus: 'ready',
    importError: null,
  }
}

export function mergeImportedPlayerCharacter(
  existing: PlayerCharacter,
  imported: ImportedPlayerCharacter
) {
  return {
    ...existing,
    ...imported,
    currentHp: existing.currentHp,
    tempHp: existing.tempHp,
    conditions: existing.conditions,
    concentration: existing.concentration,
    quickNotes: existing.quickNotes,
    importStatus: 'ready' as const,
    importError: null,
  }
}
