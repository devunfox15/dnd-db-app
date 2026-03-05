import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useEncounterTemplates } from '@/features/encounter-library/store'
import type { EncounterEnemy } from '@/features/encounter-library/types'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

interface ActiveEncounter {
  id: string
  name: string
  terrain: string
  enemies: EncounterEnemy[]
}

interface EncounterWorkspaceState {
  activeEncounters: ActiveEncounter[]
}

function enemyId() {
  return `enemy-${Math.random().toString(36).slice(2, 8)}`
}

export default function WorkspaceEncountersPage({
  campaignId,
}: {
  campaignId: string
}) {
  const templates = useEncounterTemplates(campaignId)
  const [state, setState] = useCampaignStorageState<EncounterWorkspaceState>(
    campaignId,
    'workspace-encounters',
    {
      activeEncounters: [],
    },
  )

  const sortedActiveEncounters = useMemo(
    () =>
      state.activeEncounters.map((encounter) => ({
        ...encounter,
        enemies: [...encounter.enemies].sort(
          (a, b) => b.initiative - a.initiative,
        ),
      })),
    [state.activeEncounters],
  )

  const addFromTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    if (!template) {
      return
    }

    setState((current) => ({
      ...current,
      activeEncounters: [
        ...current.activeEncounters,
        {
          id: `active-${template.id}-${Date.now()}`,
          name: template.name,
          terrain: template.terrain,
          enemies: template.enemies.map((enemy) => ({ ...enemy })),
        },
      ],
    }))
  }

  const removeActiveEncounter = (encounterId: string) => {
    setState((current) => ({
      ...current,
      activeEncounters: current.activeEncounters.filter(
        (encounter) => encounter.id !== encounterId,
      ),
    }))
  }

  const patchEnemy = (
    encounterId: string,
    enemyIdValue: string,
    patch: Partial<EncounterEnemy>,
  ) => {
    setState((current) => ({
      ...current,
      activeEncounters: current.activeEncounters.map((encounter) => {
        if (encounter.id !== encounterId) {
          return encounter
        }

        return {
          ...encounter,
          enemies: encounter.enemies.map((enemy) =>
            enemy.id === enemyIdValue ? { ...enemy, ...patch } : enemy,
          ),
        }
      }),
    }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Encounter Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No encounter templates available. Create one in Encounter Library.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  onClick={() => addFromTemplate(template.id)}
                >
                  Add {template.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {sortedActiveEncounters.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No active encounters in this workspace.
          </CardContent>
        </Card>
      ) : (
        sortedActiveEncounters.map((encounter) => (
          <Card key={encounter.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{encounter.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeActiveEncounter(encounter.id)}
                >
                  Remove
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Terrain: {encounter.terrain || 'Not set'}
              </p>
              <div className="space-y-2">
                {encounter.enemies.map((enemy) => (
                  <div
                    key={enemy.id}
                    className="grid gap-2 rounded border p-2 sm:grid-cols-[1.2fr_90px_90px_1fr]"
                  >
                    <Input
                      value={enemy.name}
                      onChange={(event) =>
                        patchEnemy(encounter.id, enemy.id, {
                          name: event.target.value,
                        })
                      }
                      placeholder="Enemy"
                    />
                    <Input
                      type="number"
                      value={enemy.hp}
                      onChange={(event) =>
                        patchEnemy(encounter.id, enemy.id, {
                          hp: Number(event.target.value) || 1,
                        })
                      }
                      placeholder="HP"
                    />
                    <Input
                      type="number"
                      value={enemy.initiative}
                      onChange={(event) =>
                        patchEnemy(encounter.id, enemy.id, {
                          initiative: Number(event.target.value) || 0,
                        })
                      }
                      placeholder="Init"
                    />
                    <Input
                      value={enemy.status ?? ''}
                      onChange={(event) =>
                        patchEnemy(encounter.id, enemy.id, {
                          status: event.target.value,
                        })
                      }
                      placeholder="Status"
                    />
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    activeEncounters: current.activeEncounters.map((item) =>
                      item.id === encounter.id
                        ? {
                            ...item,
                            enemies: [
                              ...item.enemies,
                              {
                                id: enemyId(),
                                name: 'Enemy',
                                hp: 8,
                                initiative: 10,
                                status: '',
                              },
                            ],
                          }
                        : item,
                    ),
                  }))
                }
              >
                Add Enemy
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
