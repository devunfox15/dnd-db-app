import { localStorageAdapter } from '@/features/core/storage'
import { campaignChatSections, type CampaignChatSection, type ChatMessage, type ChatStoreState } from '@/features/campaign-chat/types'

const CHAT_STORAGE_KEY = 'dnd-db.campaign-chat.v1'
const MESSAGE_LIMIT = 30

function emptyState(): ChatStoreState {
  return {
    'npc-characters': [],
    'map-builder': [],
    'story-pins': [],
    'game-timeline': [],
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sanitizeMessage(message: unknown): ChatMessage | null {
  if (!isObject(message)) {
    return null
  }

  const id = typeof message.id === 'string' ? message.id : ''
  const role = message.role
  const content = typeof message.content === 'string' ? message.content : ''
  const createdAt = typeof message.createdAt === 'string' ? message.createdAt : ''

  if (!id || !createdAt || !content) {
    return null
  }

  if (role !== 'system' && role !== 'user' && role !== 'assistant') {
    return null
  }

  return {
    id,
    role,
    content,
    createdAt,
    isError: message.isError === true,
    retrySourceUserMessageId:
      typeof message.retrySourceUserMessageId === 'string' ? message.retrySourceUserMessageId : undefined,
  }
}

function sanitizeState(value: unknown): ChatStoreState {
  const base = emptyState()

  if (!isObject(value)) {
    return base
  }

  for (const section of campaignChatSections) {
    const rawMessages = value[section]
    if (!Array.isArray(rawMessages)) {
      continue
    }

    base[section] = rawMessages
      .map((rawMessage) => sanitizeMessage(rawMessage))
      .filter((message): message is ChatMessage => Boolean(message))
      .slice(-MESSAGE_LIMIT)
  }

  return base
}

export function getCampaignChatState(): ChatStoreState {
  const raw = localStorageAdapter.getItem(CHAT_STORAGE_KEY)
  if (!raw) {
    return emptyState()
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return sanitizeState(parsed)
  } catch {
    return emptyState()
  }
}

export function saveCampaignChatState(state: ChatStoreState): void {
  const sanitized = sanitizeState(state)
  localStorageAdapter.setItem(CHAT_STORAGE_KEY, JSON.stringify(sanitized))
}

export function getSectionMessages(section: CampaignChatSection): ChatMessage[] {
  return getCampaignChatState()[section]
}

export function saveSectionMessages(section: CampaignChatSection, messages: ChatMessage[]): ChatMessage[] {
  const nextState = getCampaignChatState()
  const nextMessages = messages.slice(-MESSAGE_LIMIT)
  nextState[section] = nextMessages
  saveCampaignChatState(nextState)
  return nextMessages
}

export function clearSectionMessages(section: CampaignChatSection): void {
  const nextState = getCampaignChatState()
  nextState[section] = []
  saveCampaignChatState(nextState)
}

export function resetCampaignChatStateForTests(): void {
  localStorageAdapter.removeItem(CHAT_STORAGE_KEY)
}
