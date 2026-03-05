import { describe, expect, it } from 'vitest'

import {
  addItemToSessionBoard,
  readSessionBoard,
} from '@/features/session-workspace/session-board-store'

describe('session board store', () => {
  it('adds items to the selected column and prevents duplicates', () => {
    const campaignId = `campaign-board-test-${Date.now()}`
    const item = {
      id: 'npc-npc-1',
      title: 'Mayor Halvin',
      kind: 'npc' as const,
      sourceId: 'npc-1',
    }

    addItemToSessionBoard(campaignId, 'key-npcs', item)
    addItemToSessionBoard(campaignId, 'key-npcs', item)

    const board = readSessionBoard(campaignId)
    expect(board.columns['key-npcs']).toHaveLength(1)
    expect(board.columns['key-npcs'][0]?.title).toBe('Mayor Halvin')
  })
})
