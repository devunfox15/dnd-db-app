import { Button } from '@/components/ui/button'
import type { DieType } from '@/features/dice-roller/types'
import { cn } from '@/lib/utils'

const topRowDice: DieType[] = ['d4', 'd6', 'd8', 'd10']
const bottomRowDice: DieType[] = ['d12', 'd20', 'd100']

interface DiceSelectorProps {
  selectedDie: DieType | null
  count: number
  onDieClick: (die: DieType) => void
  onReset: () => void
  onRoll: () => void
  canRoll: boolean
  isRolling: boolean
}

export function DiceSelector({
  selectedDie,
  count,
  onDieClick,
  onReset,
  onRoll,
  canRoll,
  isRolling,
}: DiceSelectorProps) {
  const renderDieButton = (die: DieType) => (
    <Button
      key={die}
      type="button"
      variant="outline"
      className={cn(
        'relative flex-1 border-border/80 bg-background/70 text-sm',
        selectedDie === die && count > 0 && 'ring-2 ring-primary ring-offset-1',
      )}
      aria-label={`Roll ${die}`}
      aria-pressed={selectedDie === die}
      onClick={() => onDieClick(die)}
    >
      {selectedDie === die && count > 0 ? (
        <span className="absolute -top-2 -right-2 rounded-full bg-primary px-1.5 text-[0.625rem] text-primary-foreground">
          {count}
        </span>
      ) : null}
      {die}
    </Button>
  )

  return (
    <div className="w-72 space-y-3 rounded-lg border bg-background/95 p-3 shadow-xl">
      <div className="flex gap-2">{topRowDice.map(renderDieButton)}</div>
      <div className="flex gap-2">{bottomRowDice.map(renderDieButton)}</div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button type="button" variant="default" disabled={!canRoll} onClick={onRoll}>
          {isRolling ? 'Rolling...' : selectedDie && count > 0 ? `Roll ${count}${selectedDie}` : 'Roll'}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}
