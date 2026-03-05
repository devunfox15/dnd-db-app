import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppState } from '@/features/core/store'
import { addItemToSessionBoard } from '@/features/session-workspace/session-board-store'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

function defaultRoomsForLocation(name: string) {
  return [
    `${name} Exterior`,
    `${name} Main Hall`,
    `${name} Side Room`,
    `${name} Hidden Chamber`,
  ]
}

interface LocationWorkspaceState {
  selectedMapId: string | null
  selectedRoomByMapId: Record<string, string>
}

export default function WorkspaceLocationsPage({
  campaignId,
}: {
  campaignId: string
}) {
  const state = useAppState()
  const [search, setSearch] = useState('')
  const maps = useMemo(() => {
    const query = search.trim().toLowerCase()
    return state.maps
      .filter((map) => map.campaignId === campaignId)
      .filter((map) => {
        if (!query) {
          return true
        }
        return JSON.stringify(map).toLowerCase().includes(query)
      })
  }, [campaignId, search, state.maps])
  const [workspace, setWorkspace] = useCampaignStorageState<LocationWorkspaceState>(
    campaignId,
    'workspace-locations',
    {
      selectedMapId: maps[0]?.id ?? null,
      selectedRoomByMapId: {},
    },
  )

  const selectedMap =
    maps.find((map) => map.id === workspace.selectedMapId) ?? maps[0] ?? null
  const rooms = selectedMap ? defaultRoomsForLocation(selectedMap.name) : []
  const selectedRoom =
    (selectedMap && workspace.selectedRoomByMapId[selectedMap.id]) || rooms[0] || ''

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search locations"
          />

          {maps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No locations yet.</p>
          ) : (
            maps.map((map) => (
              <button
                key={map.id}
                type="button"
                className={`w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted ${
                  selectedMap?.id === map.id ? 'ring-1 ring-primary' : ''
                }`}
                onClick={() =>
                  setWorkspace((current) => ({
                    ...current,
                    selectedMapId: map.id,
                  }))
                }
              >
                <p className="font-medium">{map.name}</p>
                <p className="text-muted-foreground">{map.region || 'No region'}</p>
              </button>
            ))
          )}

          <Link to="/campaigns/$campaignId/location-database" params={{ campaignId }}>
            <Button className="w-full" variant="outline">
              Open Location Database
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedMap ? selectedMap.name : 'Select a location'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedMap ? (
            <>
              <p className="text-sm text-muted-foreground">
                {selectedMap.description || 'No location description provided.'}
              </p>

              <div className="space-y-2">
                <p className="text-sm font-medium">Room Structure</p>
                {rooms.map((room) => (
                  <button
                    key={room}
                    type="button"
                    className={`block w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted ${
                      selectedRoom === room ? 'ring-1 ring-primary' : ''
                    }`}
                    onClick={() =>
                      setWorkspace((current) => ({
                        ...current,
                        selectedRoomByMapId: {
                          ...current.selectedRoomByMapId,
                          [selectedMap.id]: room,
                        },
                      }))
                    }
                  >
                    {room}
                  </button>
                ))}
              </div>

              <div className="rounded border p-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Selected Room
                </p>
                <p className="text-base font-semibold">{selectedRoom}</p>
                <p className="text-sm text-muted-foreground">
                  Objects: Ritual dagger, cult scrolls
                </p>
                <p className="text-sm text-muted-foreground">
                  Encounter: Cult Ritual Fight
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    addItemToSessionBoard(campaignId, 'possible-locations', {
                      id: `location-${selectedMap.id}`,
                      title: selectedMap.name,
                      kind: 'location',
                      sourceId: selectedMap.id,
                    })
                  }}
                >
                  Pin Location to Board
                </Button>
                <Button variant="outline">Open Mini Dungeon Map</Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a location from the left panel.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
