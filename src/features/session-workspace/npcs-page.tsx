import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAppState } from '@/features/core/store'
import { addItemToSessionBoard } from '@/features/session-workspace/session-board-store'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

interface NpcQuickState {
  hp: number
  hostile: boolean
  quickNote: string
}

type WorkspaceNpcState = Record<string, NpcQuickState>

export default function WorkspaceNpcsPage({ campaignId }: { campaignId: string }) {
  const state = useAppState()
  const [search, setSearch] = useState('')
  const npcs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return state.npcs
      .filter((npc) => npc.campaignId === campaignId)
      .filter((npc) => {
        if (!query) {
          return true
        }
        return JSON.stringify(npc).toLowerCase().includes(query)
      })
  }, [campaignId, search, state.npcs])
  const [quickState, setQuickState] = useCampaignStorageState<WorkspaceNpcState>(
    campaignId,
    'workspace-npcs',
    {},
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace NPC Cards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search workspace NPCs"
        />

        {npcs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No NPCs available.</p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {npcs.map((npc) => {
              const npcState = quickState[npc.id] ?? {
                hp: 10,
                hostile: false,
                quickNote: '',
              }

              return (
                <div key={npc.id} className="rounded border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{npc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {npc.role || 'No role'}
                      </p>
                    </div>
                    <Link
                      to="/campaigns/$campaignId/npc-database"
                      params={{ campaignId }}
                    >
                      <Button size="sm" variant="outline">
                        Open Full Sheet
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setQuickState((current) => ({
                          ...current,
                          [npc.id]: {
                            ...npcState,
                            hp: Math.max(0, npcState.hp - 1),
                          },
                        }))
                      }
                    >
                      HP -
                    </Button>
                    <span className="text-sm">HP: {npcState.hp}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setQuickState((current) => ({
                          ...current,
                          [npc.id]: {
                            ...npcState,
                            hp: npcState.hp + 1,
                          },
                        }))
                      }
                    >
                      HP +
                    </Button>
                    <Button
                      size="sm"
                      variant={npcState.hostile ? 'default' : 'outline'}
                      onClick={() =>
                        setQuickState((current) => ({
                          ...current,
                          [npc.id]: {
                            ...npcState,
                            hostile: !npcState.hostile,
                          },
                        }))
                      }
                    >
                      {npcState.hostile ? 'Hostile' : 'Mark Hostile'}
                    </Button>
                  </div>

                  <Textarea
                    className="mt-3"
                    value={npcState.quickNote}
                    onChange={(event) =>
                      setQuickState((current) => ({
                        ...current,
                        [npc.id]: {
                          ...npcState,
                          quickNote: event.target.value,
                        },
                      }))
                    }
                    placeholder="Add quick session note"
                  />

                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        addItemToSessionBoard(campaignId, 'key-npcs', {
                          id: `npc-${npc.id}`,
                          title: npc.name,
                          kind: 'npc',
                          sourceId: npc.id,
                        })
                      }}
                    >
                      Pin to Session Board
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
