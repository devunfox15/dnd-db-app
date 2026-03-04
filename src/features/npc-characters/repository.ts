import { appRepository } from '@/features/core/store'
import type { EntityId, NpcCharacter } from '@/features/core/types'

export const npcCharactersRepository = {
  list: () => appRepository.list('npcs'),
  create: (payload: Omit<NpcCharacter, 'id' | 'createdAt' | 'updatedAt'>) => appRepository.create('npcs', payload),
  update: (id: EntityId, patch: Partial<NpcCharacter>) => appRepository.update('npcs', id, patch),
  delete: (id: EntityId) => appRepository.delete('npcs', id),
}
