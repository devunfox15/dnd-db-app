export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20'

export interface DiceRoll {
  id: string
  campaignId: string
  notation: string
  dice: DieType
  count: number
  results: number[]
  modifier: number
  total: number
  isNatTwenty: boolean
  isNatOne: boolean
  rolledAt: string
  label?: string
}

export interface PendingRoll {
  notation: string
  targetValues: number[]
  dice: DieType
  count: number
  modifier: number
  label?: string
}

export interface DiceRollerState {
  isOpen: boolean
  isRolling: boolean
  pendingRoll: PendingRoll | null
  rollsByCampaign: Record<string, DiceRoll[]>
}
