import { Dices } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { diceRollerRepository } from '@/features/dice-roller/repository'
import { useDiceTrayOpen } from '@/features/dice-roller/store'

export function DiceTrayTrigger() {
  const isOpen = useDiceTrayOpen()

  return (
    <Button
      type="button"
      size="icon-lg"
      className="fixed right-6 bottom-6 z-40 rounded-full shadow-lg"
      aria-label="Open dice roller"
      aria-pressed={isOpen}
      onClick={() => diceRollerRepository.setOpen(true)}
    >
      <Dices />
    </Button>
  )
}
