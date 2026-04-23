import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function CollapsiblePanel({
  title,
  icon: Icon,
  badge,
  children,
}: {
  title: string
  icon: LucideIcon
  badge?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="flex-1 text-left text-sm font-semibold">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {badge}
          </span>
        )}
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t px-3 pb-3 pt-2">{children}</div>}
    </div>
  )
}
