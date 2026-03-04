import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CampaignSectionWithChat } from '@/features/campaign-chat/components/campaign-section-with-chat'
import { useActiveCampaignId, useAppState } from '@/features/core/store'
import type { TimelineEvent } from '@/features/core/types'
import { TimelineEditor } from '@/features/game-timeline/components/timeline-editor'
import { gameTimelineRepository } from '@/features/game-timeline/repository'
import { useTimelineEvents } from '@/features/game-timeline/store'

function newDraft(campaignId: string, orderIndex: number): TimelineEvent {
  const now = new Date().toISOString()
  return {
    id: 'draft-event',
    campaignId,
    title: 'New Timeline Event',
    details: '',
    sessionNumber: 1,
    orderIndex,
    status: 'planned',
    isCurrent: false,
    relatedNpcIds: [],
    relatedNoteIds: [],
    createdAt: now,
    updatedAt: now,
    tags: [],
  }
}

function reorder(events: TimelineEvent[], id: string, direction: -1 | 1): TimelineEvent[] {
  const index = events.findIndex((event) => event.id === id)
  const targetIndex = index + direction

  if (index < 0 || targetIndex < 0 || targetIndex >= events.length) {
    return events
  }

  const next = [...events]
  const [moved] = next.splice(index, 1)
  next.splice(targetIndex, 0, moved)

  return next.map((event, itemIndex) => ({ ...event, orderIndex: itemIndex + 1 }))
}

export default function FeaturePage({ campaignIdOverride }: { campaignIdOverride?: string } = {}) {
  const state = useAppState()
  const campaignId = campaignIdOverride ?? useActiveCampaignId()
  const [search, setSearch] = useState('')
  const timelineEvents = useTimelineEvents(search, campaignId)
  const [selectedId, setSelectedId] = useState<string | null>(timelineEvents[0]?.id ?? null)
  const [draft, setDraft] = useState<TimelineEvent | null>(null)

  const selected = useMemo(
    () => draft ?? timelineEvents.find((event) => event.id === selectedId) ?? null,
    [draft, selectedId, timelineEvents]
  )

  useEffect(() => {
    if (!timelineEvents.some((event) => event.id === selectedId)) {
      setSelectedId(timelineEvents[0]?.id ?? null)
    }
  }, [timelineEvents, selectedId])

  if (!campaignId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Campaign Selected</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create or open a campaign from <a className="underline underline-offset-2" href="/campaigns">/campaigns</a> to manage timeline events.
        </CardContent>
      </Card>
    )
  }

  const handleCreate = () => {
    const next = newDraft(campaignId, timelineEvents.length + 1)
    setDraft(next)
    setSelectedId(next.id)
  }

  const handleSave = () => {
    if (!selected) {
      return
    }

    if (selected.id === 'draft-event') {
      const created = gameTimelineRepository.create({
        campaignId,
        title: selected.title,
        details: selected.details,
        sessionNumber: selected.sessionNumber,
        orderIndex: selected.orderIndex,
        status: selected.status,
        isCurrent: selected.isCurrent,
        relatedNpcIds: selected.relatedNpcIds,
        relatedNoteIds: selected.relatedNoteIds,
        tags: selected.tags,
      })
      setDraft(null)
      setSelectedId(created.id)
      return
    }

    gameTimelineRepository.update(selected.id, selected)
    setDraft(null)
  }

  const handleDelete = () => {
    if (!selected || selected.id === 'draft-event') {
      setDraft(null)
      setSelectedId(null)
      return
    }

    gameTimelineRepository.delete(selected.id)
    setDraft(null)
    setSelectedId(null)
  }

  const handleReorder = (id: string, direction: -1 | 1) => {
    const nextEvents = reorder(timelineEvents, id, direction)
    nextEvents.forEach((event) => {
      gameTimelineRepository.update(event.id, { orderIndex: event.orderIndex })
    })
  }

  return (
    <CampaignSectionWithChat section="game-timeline">
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Game Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events" />
            <Button className="w-full" onClick={handleCreate}>
              Create Event
            </Button>

            <div className="space-y-1">
              {timelineEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No timeline events yet.</p>
              ) : (
                timelineEvents.map((event) => (
                  <div key={event.id} className="rounded border px-2 py-1 text-xs">
                    <button
                      type="button"
                      className="w-full text-left hover:text-foreground"
                      onClick={() => {
                        setDraft(null)
                        setSelectedId(event.id)
                      }}
                    >
                      <p className="font-medium">
                        #{event.orderIndex} {event.title}
                      </p>
                      <p className="text-muted-foreground">Session {event.sessionNumber}</p>
                    </button>
                    <div className="mt-1 flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleReorder(event.id, -1)}>
                        Up
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReorder(event.id, 1)}>
                        Down
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <TimelineEditor
          event={selected}
          npcs={state.npcs.filter((npc) => npc.campaignId === campaignId)}
          notes={state.notes.filter((note) => note.campaignId === campaignId)}
          onChange={setDraft}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </CampaignSectionWithChat>
  )
}
