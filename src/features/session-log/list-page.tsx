import { useMemo, useState } from 'react'
import { NotebookPenIcon } from 'lucide-react'

import { useAppState } from '@/features/core/store'
import { EntryCard } from '@/features/session-log/entry-card'
import {
  KindFilter,
  type KindFilterValue,
} from '@/features/session-log/kind-filter'

interface SessionLogListPageProps {
  campaignId: string
}

export default function SessionLogListPage({ campaignId }: SessionLogListPageProps) {
  const state = useAppState()
  const [filter, setFilter] = useState<KindFilterValue>('all')

  const entries = useMemo(() => {
    const scoped = state.sessionLog.filter((entry) => entry.campaignId === campaignId)
    const filtered = filter === 'all' ? scoped : scoped.filter((entry) => entry.kind === filter)
    return [...filtered].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }, [campaignId, filter, state.sessionLog])

  return (
    <div className="space-y-4">
      <KindFilter value={filter} onChange={setFilter} />

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
