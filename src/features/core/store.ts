import { useMemo, useSyncExternalStore } from 'react'

import { appRepository } from './repository'
import type { AppState, CollectionKey, EntityByCollection, ListFilters } from './types'

appRepository.seedIfEmpty()

export function useAppState(): AppState {
  return useSyncExternalStore(appRepository.subscribe, appRepository.getState, appRepository.getState)
}

export function useActiveCampaignId(): string | null {
  const state = useAppState()
  if (state.activeCampaignId && state.campaigns.some((campaign) => campaign.id === state.activeCampaignId)) {
    return state.activeCampaignId
  }

  const sorted = [...state.campaigns].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return sorted[0]?.id ?? null
}

export function useActiveCampaign() {
  const state = useAppState()
  const activeCampaignId = useActiveCampaignId()
  return state.campaigns.find((campaign) => campaign.id === activeCampaignId) ?? null
}

export function useCollection<K extends CollectionKey>(
  collection: K,
  filters?: ListFilters<EntityByCollection[K]>
): EntityByCollection[K][] {
  const state = useAppState()

  return useMemo(() => {
    const source = state[collection] as EntityByCollection[K][]
    if (!filters) {
      return source
    }

    const search = filters.search?.trim().toLowerCase()

    return source.filter((item) => {
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
  }, [collection, filters, state])
}

export { appRepository }
