import { appRepository } from '@/features/core/store'
import type { EntityId, StoryPin } from '@/features/core/types'

export const storyPinsRepository = {
  list: () => appRepository.list('pins'),
  create: (payload: Omit<StoryPin, 'id' | 'createdAt' | 'updatedAt'>) => appRepository.create('pins', payload),
  update: (id: EntityId, patch: Partial<StoryPin>) => appRepository.update('pins', id, patch),
  delete: (id: EntityId) => appRepository.delete('pins', id),
}
