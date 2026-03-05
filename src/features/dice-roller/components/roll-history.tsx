import { Badge } from '@/components/ui/badge'
import type { DiceRoll } from '@/features/dice-roller/types'
import { cn } from '@/lib/utils'

interface RollHistoryProps {
  rolls: DiceRoll[]
}

function toTimeLabel(rolledAt: string): string {
  const date = new Date(rolledAt)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function RollHistory({ rolls }: RollHistoryProps) {
  return (
    <section className="rounded border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-medium">Roll History</h3>
        <span className="text-[0.625rem] text-muted-foreground">Last {Math.min(rolls.length, 10)}</span>
      </div>

      <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
        {rolls.length === 0 ? (
          <p className="text-xs text-muted-foreground">No rolls yet for this campaign.</p>
        ) : (
          rolls.slice(0, 10).map((roll) => (
            <div
              key={roll.id}
              className={cn(
                'flex items-center justify-between rounded border bg-background/70 px-2 py-1.5',
                roll.isNatTwenty && 'border-amber-400/60 bg-amber-100/30 dark:bg-amber-500/10',
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">
                  {roll.notation} {'->'} {roll.results.join(', ')}
                </p>
                <p className="text-[0.625rem] text-muted-foreground">Total {roll.total}</p>
              </div>
              <div className="ml-2 flex items-center gap-2">
                {roll.isNatTwenty ? <Badge className="bg-amber-500 text-black">NAT 20</Badge> : null}
                {roll.isNatOne ? <Badge variant="destructive">NAT 1</Badge> : null}
                <span className="text-[0.625rem] text-muted-foreground">{toTimeLabel(roll.rolledAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
