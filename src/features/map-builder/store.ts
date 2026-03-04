import { useMemo } from 'react'

import { useCollection } from '@/features/core/store'

export function useMaps(search = '', campaignId?: string | null) {
  const maps = useCollection('maps', { search, campaignId: campaignId ?? undefined })

  return useMemo(
    () => [...maps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [maps]
  )
}
