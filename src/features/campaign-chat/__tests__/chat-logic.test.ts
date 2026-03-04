import { describe, expect, it } from 'vitest'

import {
  createAssistantErrorMessage,
  createAssistantMessage,
  createUserMessage,
  findUserMessageById,
  removeRetryErrors,
} from '@/features/campaign-chat/chat-logic'
import type { ChatMessage } from '@/features/campaign-chat/types'

describe('campaign chat logic', () => {
  it('creates user and assistant messages', () => {
    const user = createUserMessage('Build an NPC with a hidden agenda.')
    const assistant = createAssistantMessage('Try a broker who is secretly funding both sides.')

    expect(user.role).toBe('user')
    expect(assistant.role).toBe('assistant')
    expect(user.content).toContain('hidden agenda')
  })

  it('creates retry-aware error messages', () => {
    const errorMessage = createAssistantErrorMessage('Could not connect to local Ollama.', 'user-1')

    expect(errorMessage.isError).toBe(true)
    expect(errorMessage.retrySourceUserMessageId).toBe('user-1')
  })

  it('removes prior retry errors but keeps other messages', () => {
    const messages: ChatMessage[] = [
      { id: 'user-1', role: 'user', content: 'First prompt', createdAt: '2026-01-01T00:00:00.000Z' },
      {
        id: 'assistant-error-1',
        role: 'assistant',
        content: 'Network failed',
        createdAt: '2026-01-01T00:00:01.000Z',
        isError: true,
        retrySourceUserMessageId: 'user-1',
      },
      {
        id: 'assistant-error-2',
        role: 'assistant',
        content: 'Another failed prompt',
        createdAt: '2026-01-01T00:00:02.000Z',
        isError: true,
        retrySourceUserMessageId: 'user-2',
      },
    ]

    const next = removeRetryErrors(messages, 'user-1')

    expect(next).toHaveLength(2)
    expect(next.some((message) => message.id === 'assistant-error-1')).toBe(false)
    expect(next.some((message) => message.id === 'assistant-error-2')).toBe(true)
  })

  it('finds the original user prompt for retry', () => {
    const messages: ChatMessage[] = [
      { id: 'user-1', role: 'user', content: 'Draft a villain.', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'assistant-1', role: 'assistant', content: 'Use a rival mage.', createdAt: '2026-01-01T00:00:01.000Z' },
    ]

    expect(findUserMessageById(messages, 'user-1')?.content).toContain('villain')
    expect(findUserMessageById(messages, 'missing')).toBeNull()
  })
})
