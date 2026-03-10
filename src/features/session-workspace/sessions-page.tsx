import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Trash2, CalendarDays, FolderOpen } from 'lucide-react'

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
import { useCampaignStorageState } from '@/features/session-workspace/storage'

interface Session {
  id: string
  title: string
  description: string
  sessionNumber: number
  createdAt: string
}

interface SessionsState {
  sessions: Session[]
}

export default function SessionsPage({ campaignId }: { campaignId: string }) {
  const [state, setState] = useCampaignStorageState<SessionsState>(
    campaignId,
    'sessions',
    { sessions: [] },
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleCreate = () => {
    const trimmed = title.trim()
    if (!trimmed) return

    const nextNumber =
      state.sessions.reduce((max, s) => Math.max(max, s.sessionNumber), 0) + 1

    setState((current) => ({
      sessions: [
        ...current.sessions,
        {
          id: crypto.randomUUID(),
          title: trimmed,
          description: description.trim(),
          sessionNumber: nextNumber,
          createdAt: new Date().toISOString(),
        },
      ],
    }))

    setTitle('')
    setDescription('')
    setCreateOpen(false)
  }

  const handleDelete = () => {
    if (!pendingDeleteId) return
    setState((current) => ({
      sessions: current.sessions.filter((s) => s.id !== pendingDeleteId),
    }))
    setPendingDeleteId(null)
  }

  const { sessions } = state

  return (
    <div className="h-full space-y-4">
      {/* Nav bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sessions</span>
          <span className="rounded-md border bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {sessions.length}
          </span>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          New Session
        </Button>
      </div>

      {/* Session grid */}
      <div className="h-full">
        {sessions.length === 0 ? (
          <div className="h-full">
            <Empty className="h-full border py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarDays />
                </EmptyMedia>
                <EmptyTitle>No sessions yet</EmptyTitle>
                <EmptyDescription>
                  Add your first session to start tracking your campaign
                  progress.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="size-4" />
                  New Session
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <div className="group flex flex-col rounded-lg border bg-card p-4 transition-shadow duration-150 hover:shadow-sm">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-snug">
                      {session.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Session #{session.sessionNumber}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {session.description || 'No description yet.'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground/50">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDeleteId(session.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    <Button size="sm" className="gap-1.5" asChild>
                      <Link
                        to="/campaigns/$campaignId/workspace/sessions/$sessionId"
                        params={{ campaignId, sessionId: session.id }}
                      >
                        <FolderOpen className="size-3.5" />
                        Open
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New session</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="session-title">
                Title
              </label>
              <Input
                id="session-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Siege of Neverwinter"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                htmlFor="session-description"
              >
                Description
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="session-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the session"
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
              <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>
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
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the session. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
