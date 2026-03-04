import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DEFAULT_CAMPAIGN_ID } from '@/features/core/sample-data'
import { useAppState } from '@/features/core/store'
import type { LookupEntry } from '@/features/core/types'
import { LookupDetail } from '@/features/dnd-lookup/components/lookup-detail'
import { dndLookupRepository } from '@/features/dnd-lookup/repository'
import { useLookupEntries } from '@/features/dnd-lookup/store'

function placeholderDraft(campaignId: string): Omit<LookupEntry, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    campaignId,
    title: 'New Lookup Entry',
    category: 'Reference',
    summary: 'Placeholder summary',
    details: 'Replace this with official rule details or campaign notes.',
    tags: ['placeholder'],
  }
}

export default function FeaturePage() {
  const state = useAppState()
  const campaignId = state.campaigns[0]?.id ?? DEFAULT_CAMPAIGN_ID
  const [search, setSearch] = useState('')
  const entries = useLookupEntries(search)
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id ?? null)

  const selected = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId]
  )

  const handleCreatePlaceholder = () => {
    const created = dndLookupRepository.createEntry(placeholderDraft(campaignId))
    setSelectedId(created.id)
  }

  const handlePin = () => {
    if (!selected) {
      return
    }

    dndLookupRepository.createPinFromLookup({
      campaignId,
      title: `Lookup: ${selected.title}`,
      summary: selected.summary,
      status: 'active',
      sourceType: 'lookup',
      sourceId: selected.id,
      tags: selected.tags,
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>RPG Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search RPG rules, monsters, mechanics"
          />
          <Button className="w-full" onClick={handleCreatePlaceholder}>
            Add Placeholder Entry
          </Button>

          <div className="space-y-1">
            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No lookup entries available.</p>
            ) : (
              entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted"
                  onClick={() => setSelectedId(entry.id)}
                >
                  <p className="font-medium">{entry.title}</p>
                  <p className="text-muted-foreground">{entry.category}</p>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <LookupDetail entry={selected} onPin={handlePin} />
    </div>
  )
}
