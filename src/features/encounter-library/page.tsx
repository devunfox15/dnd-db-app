import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useActiveCampaignId } from '@/features/core/store'
import { encounterLibraryRepository } from '@/features/encounter-library/repository'
import { useEncounterTemplates } from '@/features/encounter-library/store'
import type {
  EncounterEnemy,
  EncounterTemplate,
} from '@/features/encounter-library/types'
import { addItemToSessionBoard } from '@/features/session-workspace/session-board-store'

function emptyEnemy(): EncounterEnemy {
  return {
    id: `enemy-${Math.random().toString(36).slice(2, 9)}`,
    name: 'Enemy',
    hp: 10,
    initiative: 10,
    status: '',
  }
}

function buildDraft(campaignId: string): EncounterTemplate {
  const now = new Date().toISOString()
  return {
    id: 'draft-encounter-template',
    campaignId,
    name: 'New Encounter',
    terrain: '',
    notes: '',
    enemies: [emptyEnemy()],
    createdAt: now,
    updatedAt: now,
  }
}

export default function EncounterLibraryPage({
  campaignIdOverride,
}: { campaignIdOverride?: string } = {}) {
  const campaignId = campaignIdOverride ?? useActiveCampaignId()
  const templates = useEncounterTemplates(campaignId ?? '')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(
    templates[0]?.id ?? null,
  )
  const [draft, setDraft] = useState<EncounterTemplate | null>(null)

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return templates
    }

    return templates.filter((template) => {
      const haystack = JSON.stringify(template).toLowerCase()
      return haystack.includes(query)
    })
  }, [search, templates])

  const selected =
    draft ?? templates.find((template) => template.id === selectedId) ?? null

  if (!campaignId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Campaign Selected</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create or open a campaign from{' '}
          <a className="underline underline-offset-2" href="/campaigns">
            /campaigns
          </a>{' '}
          to manage encounter templates.
        </CardContent>
      </Card>
    )
  }

  const handleCreate = () => {
    const next = buildDraft(campaignId)
    setDraft(next)
    setSelectedId(next.id)
  }

  const handleSave = () => {
    if (!selected) {
      return
    }

    if (selected.id === 'draft-encounter-template') {
      const created = encounterLibraryRepository.create(campaignId, {
        name: selected.name,
        terrain: selected.terrain,
        notes: selected.notes,
        enemies: selected.enemies,
      })
      setDraft(null)
      setSelectedId(created.id)
      return
    }

    encounterLibraryRepository.update(selected.id, {
      name: selected.name,
      terrain: selected.terrain,
      notes: selected.notes,
      enemies: selected.enemies,
    })
    setDraft(null)
  }

  const handleDelete = () => {
    if (!selected || selected.id === 'draft-encounter-template') {
      setDraft(null)
      setSelectedId(templates[0]?.id ?? null)
      return
    }

    encounterLibraryRepository.delete(selected.id)
    setDraft(null)
    setSelectedId(templates[0]?.id ?? null)
  }

  const handleEnemyChange = (
    enemyId: string,
    patch: Partial<EncounterEnemy>,
  ) => {
    if (!selected) {
      return
    }

    const nextEnemies = selected.enemies.map((enemy) =>
      enemy.id === enemyId ? { ...enemy, ...patch } : enemy,
    )

    setDraft({ ...selected, enemies: nextEnemies })
  }

  const addEnemy = () => {
    if (!selected) {
      return
    }

    setDraft({
      ...selected,
      enemies: [...selected.enemies, emptyEnemy()],
    })
  }

  const removeEnemy = (enemyId: string) => {
    if (!selected) {
      return
    }

    const nextEnemies = selected.enemies.filter((enemy) => enemy.id !== enemyId)
    setDraft({
      ...selected,
      enemies: nextEnemies.length > 0 ? nextEnemies : [emptyEnemy()],
    })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Encounter Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search encounter templates"
          />
          <Button className="w-full" onClick={handleCreate}>
            Create Template
          </Button>

          <div className="space-y-1">
            {filteredTemplates.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No encounter templates yet.
              </p>
            ) : (
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    setDraft(null)
                    setSelectedId(template.id)
                  }}
                >
                  <p className="font-medium">{template.name}</p>
                  <p className="text-muted-foreground">
                    {template.enemies.length} enemies
                  </p>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selected ? selected.name : 'Select an encounter template'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selected ? (
            <>
              <Input
                value={selected.name}
                onChange={(event) =>
                  setDraft({ ...selected, name: event.target.value })
                }
                placeholder="Encounter name"
              />
              <Input
                value={selected.terrain}
                onChange={(event) =>
                  setDraft({ ...selected, terrain: event.target.value })
                }
                placeholder="Terrain"
              />
              <Textarea
                value={selected.notes}
                onChange={(event) =>
                  setDraft({ ...selected, notes: event.target.value })
                }
                placeholder="Encounter notes"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Enemies</p>
                  <Button size="sm" variant="outline" onClick={addEnemy}>
                    Add Enemy
                  </Button>
                </div>
                {selected.enemies.map((enemy) => (
                  <div
                    key={enemy.id}
                    className="grid gap-2 rounded border p-2 sm:grid-cols-[1.2fr_90px_90px_auto]"
                  >
                    <Input
                      value={enemy.name}
                      onChange={(event) =>
                        handleEnemyChange(enemy.id, { name: event.target.value })
                      }
                      placeholder="Enemy name"
                    />
                    <Input
                      type="number"
                      value={enemy.hp}
                      onChange={(event) =>
                        handleEnemyChange(enemy.id, {
                          hp: Number(event.target.value) || 1,
                        })
                      }
                      placeholder="HP"
                    />
                    <Input
                      type="number"
                      value={enemy.initiative}
                      onChange={(event) =>
                        handleEnemyChange(enemy.id, {
                          initiative: Number(event.target.value) || 0,
                        })
                      }
                      placeholder="Init"
                    />
                    <Button
                      variant="outline"
                      onClick={() => removeEnemy(enemy.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={handleDelete}>
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!selected) {
                      return
                    }
                    addItemToSessionBoard(campaignId, 'upcoming-encounters', {
                      id: `encounter-${selected.id}`,
                      title: selected.name,
                      kind: 'encounter',
                      sourceId: selected.id,
                    })
                  }}
                >
                  Add to Session Board
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pick a template from the left to edit and add it to your session
              board.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
