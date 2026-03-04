import { appRepository } from '@/features/core/store'
import type { EntityId, TimelineEvent } from '@/features/core/types'

export const gameTimelineRepository = {
  list: () => appRepository.list('timelineEvents'),
  create: (payload: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>) =>
    appRepository.create('timelineEvents', payload),
  update: (id: EntityId, patch: Partial<TimelineEvent>) =>
    appRepository.update('timelineEvents', id, patch),
  delete: (id: EntityId) => appRepository.delete('timelineEvents', id),
}
