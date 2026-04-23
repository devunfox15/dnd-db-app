import { useMemo, useState } from 'react'
import { NotebookPenIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { appRepository, useAppState } from '@/features/core/store'
import { EntryCard } from '@/features/session-log/entry-card'
import {
  EntryForm,
  type EntryDraft,
} from '@/features/session-log/entry-form'
import {
  KindFilter,
  type KindFilterValue,
} from '@/features/session-log/kind-filter'

interface SessionLogListPageProps {
  campaignId: string
  sessionId: string
}

const emptyDraft: EntryDraft = { kind: 'note', title: '', body: '' }

export default function SessionLogListPage({
  campaignId,
  sessionId,
}: SessionLogListPageProps) {
  const state = useAppState()
  const [filter, setFilter] = useState<KindFilterValue>('all')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<EntryDraft>(emptyDraft)

  const entries = useMemo(() => {
    const scoped = state.sessionLog.filter(
      (entry) => entry.campaignId === campaignId && entry.sessionId === sessionId,
    )
    const filtered = filter === 'all' ? scoped : scoped.filter((entry) => entry.kind === filter)
    return [...filtered].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }, [campaignId, filter, sessionId, state.sessionLog])

  function submitNew() {
    const trimmedTitle = draft.title.trim()
    const trimmedBody = draft.body.trim()
    if (!trimmedTitle && !trimmedBody) return

    appRepository.create('sessionLog', {
      campaignId,
      sessionId,
      kind: draft.kind,
      title: trimmedTitle,
      body: trimmedBody,
      timestamp: new Date().toISOString(),
    })
    setDraft(emptyDraft)
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <KindFilter value={filter} onChange={setFilter} />
        {!creating ? (
          <Button size="sm" onClick={() => setCreating(true)} className="gap-2">
            <PlusIcon className="size-4" />
            New Entry
          </Button>
        ) : null}
      </div>

      {creating ? (
        <EntryForm
          draft={draft}
          onChange={setDraft}
          onSubmit={submitNew}
          onCancel={() => {
            setCreating(false)
            setDraft(emptyDraft)
          }}
          submitLabel="Add"
        />
      ) : null}

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <NotebookPenIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No log entries yet. Add a note, event, secret, or place description
            to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
