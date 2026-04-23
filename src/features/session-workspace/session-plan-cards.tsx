import { GripVertical, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/react/sortable'

import { Button } from '@/components/ui/button'
import type {
  EncounterBlock,
  HookBlock,
  RewardBlock,
  SceneBlock,
  SecretBlock,
} from '@/features/session-workspace/session-types'

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  result.splice(to, 0, result.splice(from, 1)[0])
  return result
}

export function SceneCard({
  item,
  onDelete,
  handleRef,
}: {
  item: SceneBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-indigo-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">
              Scene
            </span>
            <p className="line-clamp-3 text-sm leading-snug">{item.text}</p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function EncounterCard({
  item,
  onDelete,
  handleRef,
}: {
  item: EncounterBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-red-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500">
              Encounter
            </span>
            <p className="font-medium leading-snug">
              {item.count > 1 && (
                <span className="mr-1.5 inline-flex items-center rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  ×{item.count}
                </span>
              )}
              {item.monsterName}
            </p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        {item.notes && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.notes}
          </p>
        )}
      </div>
    </div>
  )
}

export function SecretCard({
  item,
  onDelete,
  handleRef,
}: {
  item: SecretBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-amber-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
              Secret
            </span>
            <p className="font-medium leading-snug">{item.title}</p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        <div className="mt-1">
          <span className="inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            {item.skill} DC {item.dc}
          </span>
        </div>
        {item.content && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.content}
          </p>
        )}
      </div>
    </div>
  )
}

export function RewardCard({
  item,
  onDelete,
  handleRef,
}: {
  item: RewardBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-yellow-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
              Reward
            </span>
            <p className="font-medium leading-snug">{item.title}</p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {item.xp > 0 && (
            <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              {item.xp} XP
            </span>
          )}
          {item.loot && (
            <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              {item.loot}
            </span>
          )}
        </div>
        {item.notes && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.notes}
          </p>
        )}
      </div>
    </div>
  )
}

export function HookCard({
  item,
  onDelete,
  handleRef,
}: {
  item: HookBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-green-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-green-600 dark:text-green-400">
              Hook
            </span>
            <p className="font-medium leading-snug">{item.title}</p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </div>
  )
}

export function SortableItem({
  id,
  index,
  children,
}: {
  id: string
  index: number
  children: (handleRef: (el: Element | null) => void) => React.ReactNode
}) {
  const { ref, handleRef, isDragging } = useSortable({ id, index })

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.4 : 1 }}>
      {children(handleRef)}
    </div>
  )
}
