import { appRepository } from '@/features/core/store'
import type { EntityId, MapRecord } from '@/features/core/types'

export const mapBuilderRepository = {
  list: () => appRepository.list('maps'),
  create: (payload: Omit<MapRecord, 'id' | 'createdAt' | 'updatedAt'>) => appRepository.create('maps', payload),
  update: (id: EntityId, patch: Partial<MapRecord>) => appRepository.update('maps', id, patch),
  delete: (id: EntityId) => appRepository.delete('maps', id),
}
