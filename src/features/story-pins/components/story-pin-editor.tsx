import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { StoryPin } from '@/features/core/types'

interface StoryPinEditorProps {
  pin: StoryPin | null
  onChange: (next: StoryPin) => void
  onSave: () => void
  onDelete: () => void
}

export function StoryPinEditor({ pin, onChange, onSave, onDelete }: StoryPinEditorProps) {
  if (!pin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pin Details</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Select or create a story pin.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pin Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={pin.title} onChange={(event) => onChange({ ...pin, title: event.target.value })} placeholder="Pin title" />
        <Textarea
          value={pin.summary}
          onChange={(event) => onChange({ ...pin, summary: event.target.value })}
          placeholder="Pin summary"
        />

        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs">
            Status
            <select
              className="mt-1 w-full rounded border bg-input/20 px-2 py-1"
              value={pin.status}
              onChange={(event) => onChange({ ...pin, status: event.target.value as StoryPin['status'] })}
            >
              <option value="active">active</option>
              <option value="backlog">backlog</option>
              <option value="resolved">resolved</option>
            </select>
          </label>

          <label className="text-xs">
            Source Type
            <select
              className="mt-1 w-full rounded border bg-input/20 px-2 py-1"
              value={pin.sourceType}
              onChange={(event) =>
                onChange({ ...pin, sourceType: event.target.value as StoryPin['sourceType'] })
              }
            >
              <option value="note">note</option>
              <option value="npc">npc</option>
              <option value="timeline">timeline</option>
              <option value="lookup">lookup</option>
              <option value="map">map</option>
            </select>
          </label>
        </div>

        <Input
          value={pin.sourceId}
          onChange={(event) => onChange({ ...pin, sourceId: event.target.value })}
          placeholder="Source entity id"
        />

        <Input
          value={(pin.tags ?? []).join(', ')}
          onChange={(event) =>
            onChange({
              ...pin,
              tags: event.target.value
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean),
            })
          }
          placeholder="tags, comma separated"
        />

        <div className="flex gap-2">
          <Button onClick={onSave}>Save Pin</Button>
          <Button variant="outline" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
