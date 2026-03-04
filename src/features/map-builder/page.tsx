import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CampaignSectionWithChat } from '@/features/campaign-chat/components/campaign-section-with-chat'
import { useActiveCampaignId, useAppState } from '@/features/core/store'
import type { MapRecord } from '@/features/core/types'
import { MapEditor } from '@/features/map-builder/components/map-editor'
import { mapBuilderRepository } from '@/features/map-builder/repository'
import { useMaps } from '@/features/map-builder/store'

function newDraft(campaignId: string): MapRecord {
  const now = new Date().toISOString()
  return {
    id: 'draft-map',
    campaignId,
    name: 'New Map',
    region: '',
    description: '',
    imageUrl: '',
    usedNpcIds: [],
    linkedPinIds: [],
    usedInStory: false,
    createdAt: now,
    updatedAt: now,
    tags: [],
  }
}

export default function FeaturePage({ campaignIdOverride }: { campaignIdOverride?: string } = {}) {
  const state = useAppState()
  const campaignId = campaignIdOverride ?? useActiveCampaignId()
  const [search, setSearch] = useState('')
  const maps = useMaps(search, campaignId)
  const [selectedId, setSelectedId] = useState<string | null>(maps[0]?.id ?? null)
  const [draft, setDraft] = useState<MapRecord | null>(null)

  const selected = useMemo(
    () => draft ?? maps.find((map) => map.id === selectedId) ?? null,
    [draft, maps, selectedId]
  )

  useEffect(() => {
    if (!maps.some((map) => map.id === selectedId)) {
      setSelectedId(maps[0]?.id ?? null)
    }
  }, [maps, selectedId])

  if (!campaignId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Campaign Selected</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create or open a campaign from <a className="underline underline-offset-2" href="/campaigns">/campaigns</a> to manage maps.
        </CardContent>
      </Card>
    )
  }

  const handleCreate = () => {
    const next = newDraft(campaignId)
    setDraft(next)
    setSelectedId(next.id)
  }

  const handleSave = () => {
    if (!selected) {
      return
    }

    if (selected.id === 'draft-map') {
      const created = mapBuilderRepository.create({
        campaignId,
        name: selected.name,
        region: selected.region,
        description: selected.description,
        imageUrl: selected.imageUrl,
        usedNpcIds: selected.usedNpcIds,
        linkedPinIds: selected.linkedPinIds,
        usedInStory: selected.usedInStory,
        tags: selected.tags,
      })
      setDraft(null)
      setSelectedId(created.id)
      return
    }

    mapBuilderRepository.update(selected.id, selected)
    setDraft(null)
  }

  const handleDelete = () => {
    if (!selected || selected.id === 'draft-map') {
      setDraft(null)
      setSelectedId(null)
      return
    }

    mapBuilderRepository.delete(selected.id)
    setDraft(null)
    setSelectedId(null)
  }

  return (
    <CampaignSectionWithChat section="map-builder">
      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Map Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search maps" />
            <Button className="w-full" onClick={handleCreate}>
              Create Map Record
            </Button>

            <div className="space-y-1">
              {maps.length === 0 ? (
                <p className="text-xs text-muted-foreground">No map records yet.</p>
              ) : (
                maps.map((map) => (
                  <button
                    key={map.id}
                    type="button"
                    className="w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      setDraft(null)
                      setSelectedId(map.id)
                    }}
                  >
                    <p className="font-medium">{map.name}</p>
                    <p className="text-muted-foreground">{map.region || 'No region'}</p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <MapEditor
          map={selected}
          npcs={state.npcs.filter((npc) => npc.campaignId === campaignId)}
          pins={state.pins.filter((pin) => pin.campaignId === campaignId)}
          onChange={setDraft}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </CampaignSectionWithChat>
  )
}
