import type { SessionLogKind } from '@/features/core/types'

export type KindFilterValue = 'all' | SessionLogKind

interface KindFilterProps {
  value: KindFilterValue
  onChange: (value: KindFilterValue) => void
}

const options: { value: KindFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'event', label: 'Events' },
  { value: 'secret', label: 'Secrets' },
]

export function KindFilter({ value, onChange }: KindFilterProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-card p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
