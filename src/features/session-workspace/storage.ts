import { useEffect, useMemo, useState } from 'react'

import { localStorageAdapter } from '@/features/core/storage'

function parseStored<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function useCampaignStorageState<T>(
  campaignId: string,
  key: string,
  initialValue: T,
) {
  const storageKey = useMemo(
    () => `dnd-db.workspace.${key}.${campaignId}`,
    [campaignId, key],
  )

  const [state, setState] = useState<T>(() => {
    return parseStored(localStorageAdapter.getItem(storageKey), initialValue)
  })

  useEffect(() => {
    setState(parseStored(localStorageAdapter.getItem(storageKey), initialValue))
  }, [storageKey])

  useEffect(() => {
    localStorageAdapter.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  return [state, setState] as const
}
