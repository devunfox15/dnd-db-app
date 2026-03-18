import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Trash2, Map, FolderOpen } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { useMapsStorageState } from './storage'

interface MapRecord {
  id: string
  name: string
  description: string
  createdAt: string
}

interface MapsState {
  maps: MapRecord[]
}

export function MapLibraryPage() {
  const [state, setState] = useMapsStorageState<MapsState>({ maps: [] })

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) return

    setState((current) => ({
      maps: [
        ...current.maps,
        {
          id: crypto.randomUUID(),
          name: trimmed,
          description: description.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    }))

    setName('')
    setDescription('')
    setCreateOpen(false)
  }

  const handleDelete = () => {
    if (!pendingDeleteId) return
    setState((current) => ({
      maps: current.maps.filter((m) => m.id !== pendingDeleteId),
    }))
    setPendingDeleteId(null)
  }

  const { maps } = state

  return (
    <div className="flex h-full flex-col">
      {/* Nav bar */}
      <div className="flex shrink-0 items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Maps</span>
          <span className="rounded-md border bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {maps.length}
          </span>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          New Map
        </Button>
      </div>

      {/* Map grid */}
      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
        {maps.length === 0 ? (
          <div className="h-full">
            <Empty className="h-full border py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Map />
                </EmptyMedia>
                <EmptyTitle>No maps yet</EmptyTitle>
                <EmptyDescription>
                  Create your first map to start building your world.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="size-4" />
                  New Map
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {maps.map((map) => (
              <div
                key={map.id}
                className="group flex flex-col rounded-lg border bg-card p-4 transition-shadow duration-150 hover:shadow-sm"
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-snug">
                      {map.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Map</p>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {map.description || 'No description yet.'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground/50">
                    {new Date(map.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDeleteId(map.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    <Button size="sm" className="gap-1.5" asChild>
                      <Link to="/maps/$mapId" params={{ mapId: map.id }}>
                        <FolderOpen className="size-3.5" />
                        Open
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New map</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="map-name">
                Name
              </label>
              <Input
                id="map-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Underdark"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="map-description">
                Description
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="map-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this map"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete map?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the map. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete Map
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
