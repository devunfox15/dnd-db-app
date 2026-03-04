import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CampaignSectionWithChat } from '@/features/campaign-chat/components/campaign-section-with-chat'
import { useActiveCampaignId } from '@/features/core/store'
import type { StoryPin } from '@/features/core/types'
import { storyPinsRepository } from '@/features/story-pins/repository'
import { useStoryPins } from '@/features/story-pins/store'
import { StoryPinEditor } from '@/features/story-pins/components/story-pin-editor'

function newDraft(campaignId: string): StoryPin {
  const now = new Date().toISOString()
  return {
    id: 'draft-pin',
    campaignId,
    title: 'New Pin',
    summary: '',
    status: 'active',
    sourceType: 'note',
    sourceId: '',
    createdAt: now,
    updatedAt: now,
    tags: [],
  }
}

function sourcePath(pin: StoryPin): string {
  if (!pin.sourceId) {
    return '#'
  }

  switch (pin.sourceType) {
    case 'note':
      return '/campaigns'
    case 'npc':
      return '/campaigns/npc-characters'
    case 'timeline':
      return '/campaigns/game-timeline'
    case 'lookup':
      return '/rpg-rules'
    case 'map':
      return '/campaigns/map-builder'
    default:
      return '#'
  }
}

export default function FeaturePage() {
  const campaignId = useActiveCampaignId()
  const [search, setSearch] = useState('')
  const pins = useStoryPins(search, campaignId)
  const [selectedId, setSelectedId] = useState<string | null>(pins[0]?.id ?? null)
  const [draft, setDraft] = useState<StoryPin | null>(null)

  const selected = useMemo(
    () => draft ?? pins.find((pin) => pin.id === selectedId) ?? null,
    [draft, pins, selectedId]
  )

  useEffect(() => {
    if (!pins.some((pin) => pin.id === selectedId)) {
      setSelectedId(pins[0]?.id ?? null)
    }
  }, [pins, selectedId])

  if (!campaignId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Campaign Selected</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create or open a campaign from <a className="underline underline-offset-2" href="/campaigns">/campaigns</a> to manage story pins.
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

    if (selected.id === 'draft-pin') {
      const created = storyPinsRepository.create({
        campaignId,
        title: selected.title,
        summary: selected.summary,
        status: selected.status,
        sourceType: selected.sourceType,
        sourceId: selected.sourceId,
        tags: selected.tags,
      })
      setDraft(null)
      setSelectedId(created.id)
      return
    }

    storyPinsRepository.update(selected.id, selected)
    setDraft(null)
  }

  const handleDelete = () => {
    if (!selected || selected.id === 'draft-pin') {
      setDraft(null)
      setSelectedId(null)
      return
    }

    storyPinsRepository.delete(selected.id)
    setDraft(null)
    setSelectedId(null)
  }

  return (
    <CampaignSectionWithChat section="story-pins">
      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Story Pins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pins" />
            <Button className="w-full" onClick={handleCreate}>
              Create Pin
            </Button>

            <div className="space-y-1">
              {pins.length === 0 ? (
                <p className="text-xs text-muted-foreground">No story pins yet.</p>
              ) : (
                pins.map((pin) => (
                  <button
                    key={pin.id}
                    type="button"
                    className="w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      setDraft(null)
                      setSelectedId(pin.id)
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{pin.title}</span>
                      <span className="rounded bg-muted px-1 py-0.5 text-[10px] uppercase">{pin.status}</span>
                    </div>
                    <p className="text-muted-foreground">
                      Source: {pin.sourceType} ({sourcePath(pin)})
                    </p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <StoryPinEditor pin={selected} onChange={setDraft} onSave={handleSave} onDelete={handleDelete} />
      </div>
    </CampaignSectionWithChat>
  )
}
