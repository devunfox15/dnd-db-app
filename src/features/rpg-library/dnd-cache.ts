import { localStorageAdapter } from '@/features/core/storage'

export type DndListItem = { index: string; name: string; url: string }
export type DndListResult = { count: number; results: DndListItem[] }
export type DndDetailData = Record<string, unknown>

const LISTS_KEY = 'dnd-srd.lists'
const DETAILS_KEY = 'dnd-srd.details'

// In-memory layer — avoids JSON.parse on repeated reads within the same session
const memLists = new Map<string, DndListResult>()
const memDetails = new Map<string, DndDetailData>()

function readStorage<T>(key: string): Record<string, T> {
  try {
    const raw = localStorageAdapter.getItem(key)
    return raw ? (JSON.parse(raw) as Record<string, T>) : {}
  } catch {
    return {}
  }
}

function writeStorage<T>(key: string, data: Record<string, T>) {
  try {
    localStorageAdapter.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage quota exceeded — memory cache still works for this session
  }
}

export const dndCache = {
  getList(endpoint: string): DndListResult | null {
    if (memLists.has(endpoint)) return memLists.get(endpoint)!
    const stored = readStorage<DndListResult>(LISTS_KEY)
    if (stored[endpoint]) {
      memLists.set(endpoint, stored[endpoint])
      return stored[endpoint]
    }
    return null
  },

  setList(endpoint: string, data: DndListResult) {
    memLists.set(endpoint, data)
    const stored = readStorage<DndListResult>(LISTS_KEY)
    stored[endpoint] = data
    writeStorage(LISTS_KEY, stored)
  },

  getDetail(cacheKey: string): DndDetailData | null {
    if (memDetails.has(cacheKey)) return memDetails.get(cacheKey)!
    const stored = readStorage<DndDetailData>(DETAILS_KEY)
    if (stored[cacheKey]) {
      memDetails.set(cacheKey, stored[cacheKey])
      return stored[cacheKey]
    }
    return null
  },

  setDetail(cacheKey: string, data: DndDetailData) {
    memDetails.set(cacheKey, data)
    const stored = readStorage<DndDetailData>(DETAILS_KEY)
    stored[cacheKey] = data
    writeStorage(DETAILS_KEY, stored)
  },

  clear() {
    memLists.clear()
    memDetails.clear()
    localStorageAdapter.removeItem(LISTS_KEY)
    localStorageAdapter.removeItem(DETAILS_KEY)
  },
}
