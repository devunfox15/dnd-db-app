import { useMemo } from 'react'

import { useCollection } from '@/features/core/store'

export function useDmNotes(search = '', campaignId?: string) {
  const notes = useCollection('notes', {
    search,
    campaignId,
  })

  return useMemo(
    () => [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [notes]
  )
}
