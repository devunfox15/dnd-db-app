import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { DmNote, NpcCharacter, TimelineEvent } from '@/features/core/types'

interface TimelineEditorProps {
  event: TimelineEvent | null
  npcs: NpcCharacter[]
  notes: DmNote[]
  onChange: (next: TimelineEvent) => void
  onSave: () => void
  onDelete: () => void
}

export function TimelineEditor({
  event,
  npcs,
  notes,
  onChange,
  onSave,
  onDelete,
}: TimelineEditorProps) {
  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline Event</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Select or create a timeline event.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={event.title} onChange={(e) => onChange({ ...event, title: e.target.value })} placeholder="Title" />
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            type="number"
            value={event.sessionNumber}
            onChange={(e) =>
              onChange({
                ...event,
                sessionNumber: Number.isNaN(Number(e.target.value)) ? 1 : Number(e.target.value),
              })
            }
            placeholder="Session"
          />
          <select
            className="h-7 rounded border bg-input/20 px-2 text-xs"
            value={event.status}
            onChange={(e) => onChange({ ...event, status: e.target.value as TimelineEvent['status'] })}
          >
            <option value="planned">planned</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
          </select>
        </div>
        <Textarea value={event.details} onChange={(e) => onChange({ ...event, details: e.target.value })} placeholder="Details" />

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={event.isCurrent}
            onChange={(e) => onChange({ ...event, isCurrent: e.target.checked })}
          />
          Mark as current plot position
        </label>

        <label className="block text-xs text-muted-foreground">Related NPCs</label>
        <div className="max-h-28 space-y-1 overflow-auto rounded border p-2">
          {npcs.map((npc) => (
            <label key={npc.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={event.relatedNpcIds.includes(npc.id)}
                onChange={(changeEvent) => {
                  const relatedNpcIds = changeEvent.target.checked
                    ? [...event.relatedNpcIds, npc.id]
                    : event.relatedNpcIds.filter((id) => id !== npc.id)
                  onChange({ ...event, relatedNpcIds })
                }}
              />
              {npc.name}
            </label>
          ))}
        </div>

        <label className="block text-xs text-muted-foreground">Related Notes</label>
        <div className="max-h-28 space-y-1 overflow-auto rounded border p-2">
          {notes.map((note) => (
            <label key={note.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={event.relatedNoteIds.includes(note.id)}
                onChange={(changeEvent) => {
                  const relatedNoteIds = changeEvent.target.checked
                    ? [...event.relatedNoteIds, note.id]
                    : event.relatedNoteIds.filter((id) => id !== note.id)
                  onChange({ ...event, relatedNoteIds })
                }}
              />
              {note.title}
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave}>Save Event</Button>
          <Button variant="outline" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
