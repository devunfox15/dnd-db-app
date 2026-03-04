import type { ChatMessage } from '@/features/campaign-chat/types'

export function createMessageId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function createUserMessage(content: string, existingId?: string): ChatMessage {
  return {
    id: existingId ?? createMessageId('user'),
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  }
}

export function createAssistantMessage(content: string): ChatMessage {
  return {
    id: createMessageId('assistant'),
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  }
}

export function createAssistantErrorMessage(content: string, retrySourceUserMessageId: string): ChatMessage {
  return {
    id: createMessageId('assistant-error'),
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
    isError: true,
    retrySourceUserMessageId,
  }
}

export function removeRetryErrors(messages: ChatMessage[], retrySourceUserMessageId: string): ChatMessage[] {
  return messages.filter((message) => message.retrySourceUserMessageId !== retrySourceUserMessageId)
}

export function findUserMessageById(messages: ChatMessage[], userMessageId: string): ChatMessage | null {
  return messages.find((message) => message.role === 'user' && message.id === userMessageId) ?? null
}
