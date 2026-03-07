import { useEffect, useState } from 'react'

import { dndCache } from './dnd-cache'
import type { DndDetailData, DndListItem } from './dnd-cache'

export type { DndListItem, DndDetailData }

const API_BASE = 'https://www.dnd5eapi.co/api/2014'

// ---------------------------------------------------------------------------
// useDndList — all items for a given endpoint, cached
// ---------------------------------------------------------------------------
export function useDndList(endpoint: string): { items: DndListItem[]; loading: boolean } {
  const cached = dndCache.getList(endpoint)
  const [items, setItems] = useState<DndListItem[]>(cached?.results ?? [])
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    const hit = dndCache.getList(endpoint)
    if (hit) {
      setItems(hit.results)
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`${API_BASE}/${endpoint}?limit=400`)
      .then((r) => r.json())
      .then((data) => {
        const result = { count: data.count ?? 0, results: data.results ?? [] }
        dndCache.setList(endpoint, result)
        setItems(result.results)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [endpoint])

  return { items, loading }
}

// ---------------------------------------------------------------------------
// useDndClassSpells — spells for a specific class, cached
// ---------------------------------------------------------------------------
export function useDndClassSpells(
  classIndex: string | null,
): { items: DndListItem[]; loading: boolean } {
  const cacheKey = classIndex ? `classes/${classIndex}/spells` : null
  const cached = cacheKey ? dndCache.getList(cacheKey) : null

  const [items, setItems] = useState<DndListItem[]>(cached?.results ?? [])
  const [loading, setLoading] = useState(classIndex !== null && !cached)

  useEffect(() => {
    if (!classIndex) {
      setItems([])
      setLoading(false)
      return
    }

    const key = `classes/${classIndex}/spells`
    const hit = dndCache.getList(key)
    if (hit) {
      setItems(hit.results)
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`${API_BASE}/classes/${classIndex}/spells`)
      .then((r) => r.json())
      .then((data) => {
        const result = { count: data.count ?? 0, results: data.results ?? [] }
        dndCache.setList(key, result)
        setItems(result.results)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [classIndex])

  return { items, loading }
}

// ---------------------------------------------------------------------------
// useDndDetail — full detail for a single item, cached
// ---------------------------------------------------------------------------
export function useDndDetail(
  endpoint: string,
  index: string | null,
): { data: DndDetailData | null; loading: boolean } {
  const cacheKey = index ? `${endpoint}/${index}` : null
  const cached = cacheKey ? dndCache.getDetail(cacheKey) : null

  const [data, setData] = useState<DndDetailData | null>(cached ?? null)
  const [loading, setLoading] = useState(index !== null && !cached)

  useEffect(() => {
    if (!index) {
      setData(null)
      setLoading(false)
      return
    }

    const key = `${endpoint}/${index}`
    const hit = dndCache.getDetail(key)
    if (hit) {
      setData(hit)
      setLoading(false)
      return
    }

    setLoading(true)
    setData(null)
    fetch(`${API_BASE}/${endpoint}/${index}`)
      .then((r) => r.json())
      .then((result) => {
        dndCache.setDetail(key, result)
        setData(result)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [endpoint, index])

  return { data, loading }
}
