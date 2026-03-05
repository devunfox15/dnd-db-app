import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DieType } from '@/features/dice-roller/types'
import { cn } from '@/lib/utils'

const dieTypes: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']

interface DiceSelectorProps {
  selectedDie: DieType
  count: number
  modifier: number
  onDieChange: (die: DieType) => void
  onCountChange: (count: number) => void
  onModifierChange: (modifier: number) => void
}

export function DiceSelector({
  selectedDie,
  count,
  modifier,
  onDieChange,
  onCountChange,
  onModifierChange,
}: DiceSelectorProps) {
  return (
    <div className="space-y-3 rounded border bg-muted/30 p-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {dieTypes.map((die) => (
          <Button
            key={die}
            type="button"
            variant={selectedDie === die ? 'default' : 'outline'}
            className={cn('w-full', selectedDie === die && 'shadow-sm')}
            aria-label={`Roll ${die}`}
            aria-pressed={selectedDie === die}
            onClick={() => onDieChange(die)}
          >
            {die}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Count</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={count === value ? 'default' : 'outline'}
                aria-pressed={count === value}
                onClick={() => onCountChange(value)}
              >
                {value}
              </Button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Modifier</span>
          <Input
            type="number"
            inputMode="numeric"
            value={modifier}
            min={-99}
            max={99}
            className="w-24"
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10)
              onModifierChange(Number.isNaN(parsed) ? 0 : parsed)
            }}
          />
        </label>
      </div>
    </div>
  )
}
