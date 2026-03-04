import { useMemo } from 'react'

import { useCollection } from '@/features/core/store'

export function useTimelineEvents(search = '', campaignId?: string | null) {
  const events = useCollection('timelineEvents', { search, campaignId: campaignId ?? undefined })

  return useMemo(
    () => [...events].sort((a, b) => a.orderIndex - b.orderIndex),
    [events]
  )
}
