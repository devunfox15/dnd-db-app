import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { MapRecord, NpcCharacter, StoryPin } from '@/features/core/types'

interface MapEditorProps {
  map: MapRecord | null
  npcs: NpcCharacter[]
  pins: StoryPin[]
  onChange: (next: MapRecord) => void
  onSave: () => void
  onDelete: () => void
}

export function MapEditor({ map, npcs, pins, onChange, onSave, onDelete }: MapEditorProps) {
  if (!map) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Map Details</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Select or create a map record.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={map.name} onChange={(event) => onChange({ ...map, name: event.target.value })} placeholder="Map name" />
        <Input value={map.region} onChange={(event) => onChange({ ...map, region: event.target.value })} placeholder="Region" />
        <Input
          value={map.imageUrl}
          onChange={(event) => onChange({ ...map, imageUrl: event.target.value })}
          placeholder="Image URL"
        />
        <Textarea
          value={map.description}
          onChange={(event) => onChange({ ...map, description: event.target.value })}
          placeholder="Map notes"
        />

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={map.usedInStory}
            onChange={(event) => onChange({ ...map, usedInStory: event.target.checked })}
          />
          Used in story
        </label>

        <label className="block text-xs text-muted-foreground">NPCs on this map</label>
        <div className="max-h-32 space-y-1 overflow-auto rounded border p-2">
          {npcs.map((npc) => (
            <label key={npc.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={map.usedNpcIds.includes(npc.id)}
                onChange={(event) => {
                  const usedNpcIds = event.target.checked
                    ? [...map.usedNpcIds, npc.id]
                    : map.usedNpcIds.filter((id) => id !== npc.id)
                  onChange({ ...map, usedNpcIds })
                }}
              />
              {npc.name}
            </label>
          ))}
        </div>

        <label className="block text-xs text-muted-foreground">Linked story pins</label>
        <div className="max-h-32 space-y-1 overflow-auto rounded border p-2">
          {pins.map((pin) => (
            <label key={pin.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={map.linkedPinIds.includes(pin.id)}
                onChange={(event) => {
                  const linkedPinIds = event.target.checked
                    ? [...map.linkedPinIds, pin.id]
                    : map.linkedPinIds.filter((id) => id !== pin.id)
                  onChange({ ...map, linkedPinIds })
                }}
              />
              {pin.title}
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave}>Save Map</Button>
          <Button variant="outline" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
