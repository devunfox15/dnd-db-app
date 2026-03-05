import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppState } from '@/features/core/store'
import DmNotepadPage from '@/features/dm-notepad/page'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

interface SceneWorkspaceState {
  activeSceneId: string | null
  nextSceneIds: string[]
}

export default function SceneNotesWorkspacePage({
  campaignId,
}: {
  campaignId: string
}) {
  const state = useAppState()
  const notes = useMemo(
    () => state.notes.filter((note) => note.campaignId === campaignId),
    [campaignId, state.notes],
  )
  const [sceneState, setSceneState] = useCampaignStorageState<SceneWorkspaceState>(
    campaignId,
    'scene-notes',
    {
      activeSceneId: notes[0]?.id ?? null,
      nextSceneIds: [],
    },
  )

  const activeScene =
    notes.find((note) => note.id === sceneState.activeSceneId) ?? notes[0] ?? null
  const queuedScenes = notes.filter((note) =>
    sceneState.nextSceneIds.includes(note.id),
  )

  const toggleNextScene = (id: string) => {
    setSceneState((current) => {
      const exists = current.nextSceneIds.includes(id)
      return {
        ...current,
        nextSceneIds: exists
          ? current.nextSceneIds.filter((item) => item !== id)
          : [...current.nextSceneIds, id],
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Scene Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeScene ? (
            <div className="rounded border p-3">
              <p className="text-xs uppercase text-muted-foreground">Active Scene</p>
              <p className="text-base font-semibold">{activeScene.title}</p>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {activeScene.body || 'No scene description yet.'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Create notes to start building scene flow.
            </p>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Scene Queue</p>
            {queuedScenes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No queued scenes yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {queuedScenes.map((note) => (
                  <div key={note.id} className="rounded border px-2 py-1 text-xs">
                    {note.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {notes.map((note) => {
              const isActive = activeScene?.id === note.id
              const inQueue = sceneState.nextSceneIds.includes(note.id)
              return (
                <div
                  key={note.id}
                  className={`rounded border p-2 ${isActive ? 'ring-1 ring-primary' : ''}`}
                >
                  <p className="text-sm font-medium">{note.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() =>
                        setSceneState((current) => ({
                          ...current,
                          activeSceneId: note.id,
                        }))
                      }
                    >
                      Mark Active
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleNextScene(note.id)}
                    >
                      {inQueue ? 'Remove from Queue' : 'Add to Queue'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <DmNotepadPage campaignIdOverride={campaignId} />
    </div>
  )
}
