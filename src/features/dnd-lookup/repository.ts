import { appRepository } from '@/features/core/store'
import type { EntityId, LookupEntry, StoryPin } from '@/features/core/types'

export const dndLookupRepository = {
  list: () => appRepository.list('lookupEntries'),
  createEntry: (payload: Omit<LookupEntry, 'id' | 'createdAt' | 'updatedAt'>) =>
    appRepository.create('lookupEntries', payload),
  updateEntry: (id: EntityId, patch: Partial<LookupEntry>) =>
    appRepository.update('lookupEntries', id, patch),
  createPinFromLookup: (payload: Omit<StoryPin, 'id' | 'createdAt' | 'updatedAt'>) =>
    appRepository.create('pins', payload),
}
