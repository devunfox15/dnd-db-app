import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useActiveCampaignId, useAppState } from '@/features/core/store'
import { DEFAULT_CAMPAIGN_ID } from '@/features/core/sample-data'
import type { DmNote } from '@/features/core/types'
import { NotepadEditor } from '@/features/dm-notepad/components/notepad-editor'
import { dmNotepadRepository } from '@/features/dm-notepad/repository'
import { useDmNotes } from '@/features/dm-notepad/store'

function newDraft(campaignId: string): DmNote {
  const now = new Date().toISOString()
  return {
    id: 'draft-note',
    campaignId,
    title: 'New Note',
    body: '',
    area: '',
    linkedPinIds: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
}

export default function FeaturePage({
  campaignIdOverride,
}: { campaignIdOverride?: string } = {}) {
  const state = useAppState()
  const campaignId =
    campaignIdOverride ?? useActiveCampaignId() ?? DEFAULT_CAMPAIGN_ID
  const [search, setSearch] = useState('')
  const notes = useDmNotes(search, campaignId)
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null)
  const [draft, setDraft] = useState<DmNote | null>(null)

  const selected = useMemo(
    () => draft ?? notes.find((note) => note.id === selectedId) ?? null,
    [draft, notes, selectedId]
  )

  const startCreate = () => {
    const draftNote = newDraft(campaignId)
    setDraft(draftNote)
    setSelectedId(draftNote.id)
  }

  const handleSave = () => {
    if (!selected) {
      return
    }

    if (selected.id === 'draft-note') {
      const created = dmNotepadRepository.create({
        campaignId,
        title: selected.title,
        body: selected.body,
        area: selected.area,
        linkedPinIds: selected.linkedPinIds,
        tags: selected.tags,
      })
      setDraft(null)
      setSelectedId(created.id)
      return
    }

    dmNotepadRepository.update(selected.id, selected)
    setDraft(null)
  }

  const handleDelete = () => {
    if (!selected || selected.id === 'draft-note') {
      setDraft(null)
      setSelectedId(notes[0]?.id ?? null)
      return
    }

    dmNotepadRepository.delete(selected.id)
    setDraft(null)
    setSelectedId(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" />
          <Button onClick={startCreate} className="w-full">
            Create Note
          </Button>

          <div className="space-y-1">
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className="w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    setDraft(null)
                    setSelectedId(note.id)
                  }}
                >
                  <p className="font-medium">{note.title}</p>
                  <p className="text-muted-foreground">{note.area || 'No area set'}</p>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <NotepadEditor
        note={selected}
        pins={state.pins.filter((pin) => pin.campaignId === campaignId)}
        onChange={setDraft}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
