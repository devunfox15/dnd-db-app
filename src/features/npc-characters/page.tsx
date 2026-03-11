import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CampaignSectionWithChat } from '@/features/campaign-chat/components/campaign-section-with-chat'
import {
  appRepository,
  useActiveCampaignId,
  useAppState,
} from '@/features/core/store'
import type { NpcCharacter } from '@/features/core/types'
import { NpcEditor } from '@/features/npc-characters/components/npc-editor'
import { npcCharactersRepository } from '@/features/npc-characters/repository'
import { useNpcs } from '@/features/npc-characters/store'
import { cn } from '@/lib/utils'

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

export default function FeaturePage({
  campaignIdOverride,
}: { campaignIdOverride?: string } = {}) {
  const state = useAppState()
  const campaignId = campaignIdOverride ?? useActiveCampaignId()
  const [search, setSearch] = useState('')
  const npcs = useNpcs(search, campaignId)
  const [selectedId, setSelectedId] = useState<string | null>(
    npcs[0]?.id ?? null,
  )
  const [draft, setDraft] = useState<NpcCharacter | null>(null)

  const selected = useMemo(
    () => draft ?? npcs.find((npc) => npc.id === selectedId) ?? null,
    [draft, npcs, selectedId],
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
          Create or open a campaign from{' '}
          <a className="underline underline-offset-2" href="/campaigns">
            /campaigns
          </a>{' '}
          to manage NPCs.
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
      <div className="grid w-full gap-3">
        <Card>
          <CardHeader className="space-y-3 pb-2">
            <CardTitle className="text-base">NPC Characters</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search NPCs"
                className="w-full sm:max-w-xs"
              />
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button size="sm" className="gap-1.5" onClick={handleCreate}>
                  Add NPC
                </Button>
                <span className="rounded-md border bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {npcs.length}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2">
              {npcs.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No NPCs yet.
                </p>
              ) : (
                npcs.map((npc) => (
                  <button
                    key={npc.id}
                    type="button"
                    className={cn(
                      'w-full rounded-lg border bg-card px-3 py-3 text-left transition-colors hover:bg-muted/50',
                      selectedId === npc.id &&
                        !draft &&
                        'border-primary/40 bg-muted/40 shadow-sm',
                    )}
                    onClick={() => {
                      setDraft(null)
                      setSelectedId(npc.id)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {npc.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {npc.role || 'No role set'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] text-muted-foreground/60">
                      {npc.faction || 'NPC Record'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <NpcEditor
            npc={selected}
            maps={state.maps.filter((map) => map.campaignId === campaignId)}
            events={state.timelineEvents.filter(
              (event) => event.campaignId === campaignId,
            )}
            onChange={setDraft}
            onSave={handleSave}
            onDelete={handleDelete}
            onPinToStory={handlePinToStory}
          />
        </div>
      </div>
    </CampaignSectionWithChat>
  )
}
