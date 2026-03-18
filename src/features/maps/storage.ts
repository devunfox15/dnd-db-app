import { useEffect, useState } from 'react'

import { localStorageAdapter } from '@/features/core/storage'

const STORAGE_KEY = 'dnd-db.maps'

function parseStored<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function useMapsStorageState<T>(initialValue: T) {
  const [state, setState] = useState<T>(() =>
    parseStored(localStorageAdapter.getItem(STORAGE_KEY), initialValue),
  )

  useEffect(() => {
    localStorageAdapter.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return [state, setState] as const
}
