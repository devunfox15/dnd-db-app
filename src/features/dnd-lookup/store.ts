import { useMemo } from 'react'

import { useCollection } from '@/features/core/store'

export function filterLookupEntries<T extends { title: string; category: string; summary: string; details: string }>(
  entries: T[],
  query: string
): T[] {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return entries
  }

  return entries.filter((entry) =>
    [entry.title, entry.category, entry.summary, entry.details]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  )
}

export function useLookupEntries(query = '') {
  const entries = useCollection('lookupEntries')

  return useMemo(() => filterLookupEntries(entries, query), [entries, query])
}
