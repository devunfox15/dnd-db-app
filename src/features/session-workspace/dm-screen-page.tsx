import { useMemo, useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  X,
  GripVertical,
  Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppState } from '@/features/core/store'
import {
  SESSION_BOARD_COLUMNS,
  type SessionBoardColumnId,
  type SessionBoardItem,
  addItemToSessionBoard,
  useSessionBoard,
} from '@/features/session-workspace/session-board-store'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

interface SceneWorkspaceState {
  activeSceneId: string | null
  nextSceneIds: string[]
}

interface LocationWorkspaceState {
  selectedMapId: string | null
  selectedRoomByMapId: Record<string, string>
}

interface SuggestedItem {
  item: SessionBoardItem
  columnId: SessionBoardColumnId
}

function reorderWithinColumn(
  items: SessionBoardItem[],
  fromId: string,
  toId: string,
): SessionBoardItem[] {
  const fromIndex = items.findIndex((item) => item.id === fromId)
  const toIndex = items.findIndex((item) => item.id === toId)
  if (fromIndex < 0 || toIndex < 0) {
    return items
  }

  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

function findItemColumn(
  columns: Record<SessionBoardColumnId, SessionBoardItem[]>,
  itemId: string,
): SessionBoardColumnId | null {
  for (const column of SESSION_BOARD_COLUMNS) {
    if (columns[column.id].some((item) => item.id === itemId)) {
      return column.id
    }
  }

  return null
}

export default function DmScreenPage({ campaignId }: { campaignId: string }) {
  const state = useAppState()
  const { state: boardState, setState } = useSessionBoard(campaignId)
  const [dragItemId, setDragItemId] = useState<string | null>(null)
  const [sceneState] = useCampaignStorageState<SceneWorkspaceState>(
    campaignId,
    'scene-notes',
    {
      activeSceneId: null,
      nextSceneIds: [],
    },
  )
  const [locationState] = useCampaignStorageState<LocationWorkspaceState>(
    campaignId,
    'workspace-locations',
    {
      selectedMapId: null,
      selectedRoomByMapId: {},
    },
  )

  const suggestions = useMemo((): SuggestedItem[] => {
    const next: SuggestedItem[] = []

    const activeScene = state.notes.find(
      (note) =>
        note.id === sceneState.activeSceneId && note.campaignId === campaignId,
    )
    if (activeScene) {
      next.push({
        columnId: 'active-scene',
        item: {
          id: `scene-${activeScene.id}`,
          title: activeScene.title,
          kind: 'scene',
          sourceId: activeScene.id,
        },
      })

      next.push({
        columnId: 'session-notes',
        item: {
          id: `note-${activeScene.id}`,
          title: `Note: ${activeScene.title}`,
          kind: 'note',
          sourceId: activeScene.id,
        },
      })
    }

    const selectedLocation = state.maps.find(
      (map) =>
        map.id === locationState.selectedMapId && map.campaignId === campaignId,
    )

    if (selectedLocation) {
      next.push({
        columnId: 'possible-locations',
        item: {
          id: `location-${selectedLocation.id}`,
          title: selectedLocation.name,
          kind: 'location',
          sourceId: selectedLocation.id,
        },
      })

      const keyNpcId = selectedLocation.usedNpcIds[0]
      const keyNpc = state.npcs.find((npc) => npc.id === keyNpcId)
      if (keyNpc) {
        next.push({
          columnId: 'key-npcs',
          item: {
            id: `npc-${keyNpc.id}`,
            title: keyNpc.name,
            kind: 'npc',
            sourceId: keyNpc.id,
          },
        })
      }

      const linkedPinId = selectedLocation.linkedPinIds[0]
      const linkedPin = state.pins.find((pin) => pin.id === linkedPinId)
      if (linkedPin) {
        next.push({
          columnId: 'hidden-secrets',
          item: {
            id: `secret-${linkedPin.id}`,
            title: linkedPin.title,
            kind: 'secret',
            sourceId: linkedPin.id,
          },
        })
      }
    }

    return next
  }, [
    campaignId,
    locationState.selectedMapId,
    sceneState.activeSceneId,
    state.maps,
    state.notes,
    state.npcs,
    state.pins,
  ])

  const moveAcrossColumns = (
    itemId: string,
    targetColumnId: SessionBoardColumnId,
    targetIndex?: number,
  ) => {
    const sourceColumnId = findItemColumn(boardState.columns, itemId)
    if (!sourceColumnId) {
      return
    }

    if (sourceColumnId === targetColumnId && targetIndex == null) {
      return
    }

    const sourceItems = [...boardState.columns[sourceColumnId]]
    const targetItems =
      sourceColumnId === targetColumnId
        ? sourceItems
        : [...boardState.columns[targetColumnId]]
    const sourceIndex = sourceItems.findIndex((item) => item.id === itemId)
    if (sourceIndex < 0) {
      return
    }

    const [moved] = sourceItems.splice(sourceIndex, 1)

    if (sourceColumnId === targetColumnId) {
      const nextIndex = Math.max(
        0,
        Math.min(targetIndex ?? 0, targetItems.length),
      )
      targetItems.splice(nextIndex, 0, moved)
      setState((current) => ({
        ...current,
        columns: {
          ...current.columns,
          [sourceColumnId]: targetItems,
        },
      }))
      return
    }

    const insertIndex =
      targetIndex == null
        ? targetItems.length
        : Math.max(0, Math.min(targetIndex, targetItems.length))
    targetItems.splice(insertIndex, 0, moved)

    setState((current) => ({
      ...current,
      columns: {
        ...current.columns,
        [sourceColumnId]: sourceItems,
        [targetColumnId]: targetItems,
      },
    }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Suggested Pins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Suggestions appear when an active scene or location is selected.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.item.id}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    addItemToSessionBoard(
                      campaignId,
                      suggestion.columnId,
                      suggestion.item,
                    )
                  }
                >
                  <Plus className="size-3.5" />
                  {suggestion.item.title}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {SESSION_BOARD_COLUMNS.map((column) => {
          const items = boardState.columns[column.id]

          return (
            <Card
              key={column.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!dragItemId) {
                  return
                }
                moveAcrossColumns(dragItemId, column.id)
                setDragItemId(null)
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {column.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {items.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                    No pinned cards
                  </p>
                ) : (
                  items.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDragItemId(item.id)}
                      onDragEnd={() => setDragItemId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        if (!dragItemId || dragItemId === item.id) {
                          return
                        }

                        const sourceColumn = findItemColumn(
                          boardState.columns,
                          dragItemId,
                        )

                        if (!sourceColumn) {
                          return
                        }

                        if (sourceColumn === column.id) {
                          setState((current) => ({
                            ...current,
                            columns: {
                              ...current.columns,
                              [column.id]: reorderWithinColumn(
                                current.columns[column.id],
                                dragItemId,
                                item.id,
                              ),
                            },
                          }))
                        } else {
                          const targetIndex = boardState.columns[
                            column.id
                          ].findIndex((entry) => entry.id === item.id)
                          moveAcrossColumns(dragItemId, column.id, targetIndex)
                        }

                        setDragItemId(null)
                      }}
                      className={`group flex cursor-grab items-center gap-2 rounded-md border bg-card px-2 py-1.5 transition-colors duration-150 active:cursor-grabbing ${
                        dragItemId === item.id ? 'opacity-50' : 'hover:bg-accent/50'
                      }`}
                    >
                      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                      <p className="flex-1 truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <div className="flex shrink-0 items-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 cursor-pointer"
                          disabled={index === 0}
                          onClick={() => {
                            const targetIndex = index - 1
                            if (targetIndex < 0) return
                            setState((current) => ({
                              ...current,
                              columns: {
                                ...current.columns,
                                [column.id]: reorderWithinColumn(
                                  current.columns[column.id],
                                  item.id,
                                  current.columns[column.id][targetIndex].id,
                                ),
                              },
                            }))
                          }}
                        >
                          <ChevronUp className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 cursor-pointer"
                          disabled={index === items.length - 1}
                          onClick={() => {
                            const targetIndex = index + 1
                            if (targetIndex >= items.length) return
                            setState((current) => ({
                              ...current,
                              columns: {
                                ...current.columns,
                                [column.id]: reorderWithinColumn(
                                  current.columns[column.id],
                                  item.id,
                                  current.columns[column.id][targetIndex].id,
                                ),
                              },
                            }))
                          }}
                        >
                          <ChevronDown className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 cursor-pointer text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setState((current) => ({
                              ...current,
                              columns: {
                                ...current.columns,
                                [column.id]: current.columns[column.id].filter(
                                  (entry) => entry.id !== item.id,
                                ),
                              },
                            }))
                          }}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
