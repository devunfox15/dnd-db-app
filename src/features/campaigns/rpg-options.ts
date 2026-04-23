import type { CampaignRpgSystem } from '@/features/core/types'

export const rpgOptions: Array<{ value: CampaignRpgSystem; label: string }> = [
  { value: 'dnd-5e', label: 'D&D 5e' },
  { value: 'pathfinder-2e', label: 'Pathfinder 2e' },
  { value: 'call-of-cthulhu-7e', label: 'Call of Cthulhu 7e' },
  { value: 'cyberpunk-red', label: 'Cyberpunk RED' },
]

export const mvpRpgOptions = rpgOptions.filter((option) => option.value === 'dnd-5e')

export function rpgLabel(value: CampaignRpgSystem): string {
  return rpgOptions.find((option) => option.value === value)?.label ?? value
}
