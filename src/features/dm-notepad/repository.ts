import { appRepository } from '@/features/core/store'
import type { DmNote, EntityId } from '@/features/core/types'

export const dmNotepadRepository = {
  list: () => appRepository.list('notes'),
  create: (payload: Omit<DmNote, 'id' | 'createdAt' | 'updatedAt'>) => appRepository.create('notes', payload),
  update: (id: EntityId, patch: Partial<DmNote>) => appRepository.update('notes', id, patch),
  delete: (id: EntityId) => appRepository.delete('notes', id),
}
