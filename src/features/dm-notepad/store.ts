import { useMemo } from 'react'

import { useCollection } from '@/features/core/store'

export function useDmNotes(search = '') {
  const notes = useCollection('notes', { search })

  return useMemo(
    () => [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [notes]
  )
}
