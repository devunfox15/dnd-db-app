import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { appRepository } from '@/features/core/store'
import type { SessionLogEntry, SessionLogKind } from '@/features/core/types'
import {
  EntryForm,
  type EntryDraft,
} from '@/features/session-log/entry-form'

const kindLabel: Record<SessionLogKind, string> = {
  note: 'Note',
  event: 'Event',
  secret: 'Secret',
}

const kindBadgeClass: Record<SessionLogKind, string> = {
  note: 'bg-muted text-muted-foreground',
  event: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100',
  secret: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
}

interface EntryCardProps {
  entry: SessionLogEntry
}

export function EntryCard({ entry }: EntryCardProps) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draft, setDraft] = useState<EntryDraft>({
    kind: entry.kind,
    title: entry.title,
    body: entry.body,
  })

  function save() {
    appRepository.update('sessionLog', entry.id, {
      kind: draft.kind,
      title: draft.title,
      body: draft.body,
    })
    setEditing(false)
  }

  function cancel() {
    setDraft({ kind: entry.kind, title: entry.title, body: entry.body })
    setEditing(false)
  }

  function remove() {
    appRepository.delete('sessionLog', entry.id)
  }

  if (editing) {
    return (
      <EntryForm
        draft={draft}
        onChange={setDraft}
        onSubmit={save}
        onCancel={cancel}
        submitLabel="Save"
      />
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${kindBadgeClass[entry.kind]}`}
            >
              {kindLabel[entry.kind]}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
          <CardTitle className="text-base">{entry.title || 'Untitled'}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {confirmDelete ? (
            <>
              <Button size="sm" variant="destructive" onClick={remove}>
                Confirm Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
        {entry.body}
      </CardContent>
    </Card>
  )
}
