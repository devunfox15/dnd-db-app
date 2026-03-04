import { useMemo } from 'react'

import { useCollection } from '@/features/core/store'

export function useNpcs(search = '', campaignId?: string | null) {
  const npcs = useCollection('npcs', { search, campaignId: campaignId ?? undefined })

  return useMemo(
    () => [...npcs].sort((a, b) => a.name.localeCompare(b.name)),
    [npcs]
  )
}
