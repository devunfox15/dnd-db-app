import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { MapRecord, NpcCharacter, TimelineEvent } from '@/features/core/types'

interface NpcEditorProps {
  npc: NpcCharacter | null
  maps: MapRecord[]
  events: TimelineEvent[]
  onChange: (next: NpcCharacter) => void
  onSave: () => void
  onDelete: () => void
  onPinToStory: () => void
}

export function NpcEditor({
  npc,
  maps,
  events,
  onChange,
  onSave,
  onDelete,
  onPinToStory,
}: NpcEditorProps) {
  if (!npc) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">NPC Details</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Select or create an NPC.</CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">NPC Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <Input value={npc.name} onChange={(event) => onChange({ ...npc, name: event.target.value })} placeholder="NPC name" />
        <Input value={npc.role} onChange={(event) => onChange({ ...npc, role: event.target.value })} placeholder="Role" />
        <Input
          value={npc.faction}
          onChange={(event) => onChange({ ...npc, faction: event.target.value })}
          placeholder="Faction"
        />
        <Textarea
          value={npc.notes}
          onChange={(event) => onChange({ ...npc, notes: event.target.value })}
          placeholder="NPC notes"
        />

        <label className="block text-xs text-muted-foreground">Used in maps</label>
        <div className="max-h-32 space-y-1 overflow-auto rounded border p-2">
          {maps.map((map) => (
            <label key={map.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={npc.usedInMapIds.includes(map.id)}
                onChange={(event) => {
                  const usedInMapIds = event.target.checked
                    ? [...npc.usedInMapIds, map.id]
                    : npc.usedInMapIds.filter((id) => id !== map.id)
                  onChange({ ...npc, usedInMapIds })
                }}
              />
              {map.name}
            </label>
          ))}
        </div>

        <label className="block text-xs text-muted-foreground">Used in timeline events</label>
        <div className="max-h-32 space-y-1 overflow-auto rounded border p-2">
          {events.map((event) => (
            <label key={event.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={npc.usedInTimelineEventIds.includes(event.id)}
                onChange={(changeEvent) => {
                  const usedInTimelineEventIds = changeEvent.target.checked
                    ? [...npc.usedInTimelineEventIds, event.id]
                    : npc.usedInTimelineEventIds.filter((id) => id !== event.id)
                  onChange({ ...npc, usedInTimelineEventIds })
                }}
              />
              {event.title}
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSave}>Save NPC</Button>
          <Button variant="outline" onClick={onPinToStory}>
            Pin to Story
          </Button>
          <Button variant="outline" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
