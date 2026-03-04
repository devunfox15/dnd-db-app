import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppState } from '@/features/core/store'

type RecentItem = {
  id: string
  label: string
  updatedAt: string
}

function buildRecentItems(state: ReturnType<typeof useAppState>): RecentItem[] {
  return [
    ...state.notes.map((item) => ({ id: item.id, label: `Note: ${item.title}`, updatedAt: item.updatedAt })),
    ...state.pins.map((item) => ({ id: item.id, label: `Pin: ${item.title}`, updatedAt: item.updatedAt })),
    ...state.maps.map((item) => ({ id: item.id, label: `Map: ${item.name}`, updatedAt: item.updatedAt })),
    ...state.npcs.map((item) => ({ id: item.id, label: `NPC: ${item.name}`, updatedAt: item.updatedAt })),
    ...state.timelineEvents.map((item) => ({ id: item.id, label: `Timeline: ${item.title}`, updatedAt: item.updatedAt })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
}

export function DashboardSummary() {
  const state = useAppState()
  const activePins = state.pins.filter((pin) => pin.status === 'active').length
  const currentEvent = state.timelineEvents.find((event) => event.isCurrent)
  const recentItems = buildRecentItems(state)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{state.notes.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Pins</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activePins}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>NPC Count</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{state.npcs.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Plot Event</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {currentEvent ? currentEvent.title : 'No current event selected'}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Updated</CardTitle>
        </CardHeader>
        <CardContent>
          {recentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <ul className="space-y-1">
              {recentItems.map((item) => (
                <li key={item.id} className="text-sm">
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
