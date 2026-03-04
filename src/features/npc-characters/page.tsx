import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CampaignSectionWithChat } from '@/features/campaign-chat/components/campaign-section-with-chat'
import { appRepository, useActiveCampaignId, useAppState } from '@/features/core/store'
import type { NpcCharacter } from '@/features/core/types'
import { NpcEditor } from '@/features/npc-characters/components/npc-editor'
import { npcCharactersRepository } from '@/features/npc-characters/repository'
import { useNpcs } from '@/features/npc-characters/store'

function newDraft(campaignId: string): NpcCharacter {
  const now = new Date().toISOString()
  return {
    id: 'draft-npc',
    campaignId,
    name: 'New NPC',
    role: '',
    faction: '',
    notes: '',
    usedInMapIds: [],
    usedInTimelineEventIds: [],
    createdAt: now,
    updatedAt: now,
    tags: [],
  }
}

export default function FeaturePage() {
  const state = useAppState()
  const campaignId = useActiveCampaignId()
  const [search, setSearch] = useState('')
  const npcs = useNpcs(search, campaignId)
  const [selectedId, setSelectedId] = useState<string | null>(npcs[0]?.id ?? null)
  const [draft, setDraft] = useState<NpcCharacter | null>(null)

  const selected = useMemo(
    () => draft ?? npcs.find((npc) => npc.id === selectedId) ?? null,
    [draft, npcs, selectedId]
  )

  useEffect(() => {
    if (!npcs.some((npc) => npc.id === selectedId)) {
      setSelectedId(npcs[0]?.id ?? null)
    }
  }, [npcs, selectedId])

  if (!campaignId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Campaign Selected</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create or open a campaign from <a className="underline underline-offset-2" href="/campaigns">/campaigns</a> to manage NPCs.
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

    if (selected.id === 'draft-npc') {
      const created = npcCharactersRepository.create({
        campaignId,
        name: selected.name,
        role: selected.role,
        faction: selected.faction,
        notes: selected.notes,
        usedInMapIds: selected.usedInMapIds,
        usedInTimelineEventIds: selected.usedInTimelineEventIds,
        tags: selected.tags,
      })
      setDraft(null)
      setSelectedId(created.id)
      return
    }

    npcCharactersRepository.update(selected.id, selected)
    setDraft(null)
  }

  const handleDelete = () => {
    if (!selected || selected.id === 'draft-npc') {
      setDraft(null)
      setSelectedId(null)
      return
    }

    npcCharactersRepository.delete(selected.id)
    setDraft(null)
    setSelectedId(null)
  }

  const handlePinToStory = () => {
    if (!selected || selected.id === 'draft-npc') {
      return
    }

    appRepository.create('pins', {
      campaignId,
      title: `NPC: ${selected.name}`,
      summary: selected.notes || 'Pinned from NPC character page.',
      status: 'active',
      sourceType: 'npc',
      sourceId: selected.id,
      tags: selected.tags,
    })
  }

  return (
    <CampaignSectionWithChat section="npc-characters">
      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>NPC Characters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search NPCs" />
            <Button className="w-full" onClick={handleCreate}>
              Create NPC
            </Button>

            <div className="space-y-1">
              {npcs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No NPCs yet.</p>
              ) : (
                npcs.map((npc) => (
                  <button
                    key={npc.id}
                    type="button"
                    className="w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      setDraft(null)
                      setSelectedId(npc.id)
                    }}
                  >
                    <p className="font-medium">{npc.name}</p>
                    <p className="text-muted-foreground">{npc.role || 'No role set'}</p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <NpcEditor
          npc={selected}
          maps={state.maps.filter((map) => map.campaignId === campaignId)}
          events={state.timelineEvents.filter((event) => event.campaignId === campaignId)}
          onChange={setDraft}
          onSave={handleSave}
          onDelete={handleDelete}
          onPinToStory={handlePinToStory}
        />
      </div>
    </CampaignSectionWithChat>
  )
}
