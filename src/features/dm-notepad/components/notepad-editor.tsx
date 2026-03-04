import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { StoryPin } from '@/features/core/types'
import type { DmNotepadItem } from '@/features/dm-notepad/types'

interface NotepadEditorProps {
  note: DmNotepadItem | null
  pins: StoryPin[]
  onChange: (next: DmNotepadItem) => void
  onSave: () => void
  onDelete: () => void
}

export function NotepadEditor({ note, pins, onChange, onSave, onDelete }: NotepadEditorProps) {
  if (!note) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Select or create a note to edit.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Note Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={note.title}
          onChange={(event) => onChange({ ...note, title: event.target.value })}
          placeholder="Title"
        />
        <Input
          value={note.area}
          onChange={(event) => onChange({ ...note, area: event.target.value })}
          placeholder="Area or location"
        />
        <Input
          value={(note.tags ?? []).join(', ')}
          onChange={(event) =>
            onChange({
              ...note,
              tags: event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
          placeholder="tags, comma separated"
        />
        <Textarea
          value={note.body}
          onChange={(event) => onChange({ ...note, body: event.target.value })}
          placeholder="Encounter notes, clues, area details..."
          className="min-h-36"
        />

        <label className="block text-xs text-muted-foreground">Linked Story Pins</label>
        <div className="max-h-36 space-y-1 overflow-auto rounded-md border p-2">
          {pins.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pins available yet.</p>
          ) : (
            pins.map((pin) => {
              const checked = note.linkedPinIds.includes(pin.id)
              return (
                <label key={pin.id} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const linkedPinIds = event.target.checked
                        ? [...note.linkedPinIds, pin.id]
                        : note.linkedPinIds.filter((id) => id !== pin.id)

                      onChange({ ...note, linkedPinIds })
                    }}
                  />
                  <span>{pin.title}</span>
                </label>
              )
            })
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave}>Save Note</Button>
          <Button variant="outline" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
