import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SessionLogKind } from '@/features/core/types'

export interface EntryDraft {
  kind: SessionLogKind
  title: string
  body: string
}

interface EntryFormProps {
  draft: EntryDraft
  onChange: (draft: EntryDraft) => void
  onSubmit: () => void
  onCancel?: () => void
  submitLabel: string
}

const kindOptions: { value: SessionLogKind; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'event', label: 'Event' },
  { value: 'secret', label: 'Secret' },
]

export function EntryForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: EntryFormProps) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={draft.kind}
          onChange={(event) =>
            onChange({ ...draft, kind: event.target.value as SessionLogKind })
          }
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          {kindOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Input
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          placeholder="Title"
          className="flex-1 min-w-[12rem]"
        />
      </div>
      <Textarea
        value={draft.body}
        onChange={(event) => onChange({ ...draft, body: event.target.value })}
        placeholder="Body — describe the scene, event, secret, or place"
        rows={4}
      />
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!draft.title.trim() && !draft.body.trim()}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
