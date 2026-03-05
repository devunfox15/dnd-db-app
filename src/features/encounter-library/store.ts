import { useMemo, useSyncExternalStore } from 'react'

import { encounterLibraryRepository } from '@/features/encounter-library/repository'

export function useEncounterLibraryState() {
  return useSyncExternalStore(
    encounterLibraryRepository.subscribe,
    encounterLibraryRepository.getState,
    encounterLibraryRepository.getState,
  )
}

export function useEncounterTemplates(campaignId: string) {
  useEncounterLibraryState()

  return useMemo(
    () => encounterLibraryRepository.list(campaignId),
    [campaignId],
  )
}
