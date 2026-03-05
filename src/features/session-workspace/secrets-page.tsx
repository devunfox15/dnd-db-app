import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppState } from '@/features/core/store'
import { addItemToSessionBoard } from '@/features/session-workspace/session-board-store'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

interface SecretWorkspaceMeta {
  trigger: string
  dc: number
  revealMode: 'auto' | 'manual'
  lastRoll?: number
  result?: 'success' | 'failure'
}

type SecretWorkspaceState = Record<string, SecretWorkspaceMeta>

export default function WorkspaceSecretsPage({
  campaignId,
}: {
  campaignId: string
}) {
  const state = useAppState()
  const pins = useMemo(
    () => state.pins.filter((pin) => pin.campaignId === campaignId),
    [campaignId, state.pins],
  )
  const [secretMeta, setSecretMeta] = useCampaignStorageState<SecretWorkspaceState>(
    campaignId,
    'workspace-secrets',
    {},
  )

  if (pins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Secrets Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No secrets yet. Add entries in Lore / Secrets Database.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {pins.map((pin) => {
        const meta = secretMeta[pin.id] ?? {
          trigger: 'investigation',
          dc: 15,
          revealMode: 'auto' as const,
        }

        return (
          <Card key={pin.id}>
            <CardHeader>
              <CardTitle>{pin.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{pin.summary}</p>

              <Input
                value={meta.trigger}
                onChange={(event) =>
                  setSecretMeta((current) => ({
                    ...current,
                    [pin.id]: {
                      ...meta,
                      trigger: event.target.value,
                    },
                  }))
                }
                placeholder="Trigger"
              />

              <Input
                type="number"
                value={meta.dc}
                onChange={(event) =>
                  setSecretMeta((current) => ({
                    ...current,
                    [pin.id]: {
                      ...meta,
                      dc: Number(event.target.value) || 10,
                    },
                  }))
                }
                placeholder="DC"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={meta.revealMode === 'auto' ? 'default' : 'outline'}
                  onClick={() =>
                    setSecretMeta((current) => ({
                      ...current,
                      [pin.id]: {
                        ...meta,
                        revealMode: 'auto',
                      },
                    }))
                  }
                >
                  Auto Roll
                </Button>
                <Button
                  size="sm"
                  variant={meta.revealMode === 'manual' ? 'default' : 'outline'}
                  onClick={() =>
                    setSecretMeta((current) => ({
                      ...current,
                      [pin.id]: {
                        ...meta,
                        revealMode: 'manual',
                      },
                    }))
                  }
                >
                  Manual Reveal
                </Button>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const roll = Math.floor(Math.random() * 20) + 1
                  setSecretMeta((current) => ({
                    ...current,
                    [pin.id]: {
                      ...meta,
                      lastRoll: roll,
                      result: roll >= meta.dc ? 'success' : 'failure',
                    },
                  }))
                }}
              >
                Roll d20
              </Button>

              {typeof meta.lastRoll === 'number' ? (
                <p className="text-sm">
                  Result: {meta.lastRoll} - {meta.result}
                </p>
              ) : null}

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  addItemToSessionBoard(campaignId, 'hidden-secrets', {
                    id: `secret-${pin.id}`,
                    title: pin.title,
                    kind: 'secret',
                    sourceId: pin.id,
                  })
                }
              >
                Pin Secret to Session Board
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
