import { beforeEach, describe, expect, it } from 'vitest'

import { clearSectionMessages, getCampaignChatState, saveSectionMessages, resetCampaignChatStateForTests } from '@/features/campaign-chat/store'
import type { ChatMessage } from '@/features/campaign-chat/types'

function makeMessage(id: string): ChatMessage {
  return {
    id,
    role: 'user',
    content: `message-${id}`,
    createdAt: new Date().toISOString(),
  }
}

describe('campaign chat store', () => {
  beforeEach(() => {
    resetCampaignChatStateForTests()
  })

  it('stores section messages independently', () => {
    saveSectionMessages('npc-characters', [makeMessage('npc-1')])
    saveSectionMessages('story-pins', [makeMessage('pin-1')])

    const state = getCampaignChatState()
    expect(state['npc-characters']).toHaveLength(1)
    expect(state['story-pins']).toHaveLength(1)
    expect(state['game-timeline']).toHaveLength(0)
  })

  it('clearing one section does not clear others', () => {
    saveSectionMessages('npc-characters', [makeMessage('npc-1')])
    saveSectionMessages('story-pins', [makeMessage('pin-1')])

    clearSectionMessages('npc-characters')

    const state = getCampaignChatState()
    expect(state['npc-characters']).toHaveLength(0)
    expect(state['story-pins']).toHaveLength(1)
  })

  it('caps stored messages to the latest 30', () => {
    const messages = Array.from({ length: 45 }, (_, idx) => makeMessage(String(idx + 1)))
    const saved = saveSectionMessages('game-timeline', messages)

    expect(saved).toHaveLength(30)
    expect(saved[0]?.id).toBe('16')
    expect(saved[29]?.id).toBe('45')
  })
})
