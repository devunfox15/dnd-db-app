import { useMemo } from 'react'

import { useCollection } from '@/features/core/store'

export function useStoryPins(search = '', campaignId?: string | null) {
  const pins = useCollection('pins', { search, campaignId: campaignId ?? undefined })

  return useMemo(
    () => [...pins].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [pins]
  )
}
