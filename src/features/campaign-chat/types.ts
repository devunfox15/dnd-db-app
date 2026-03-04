import type { AppState } from '@/features/core/types'

export const campaignChatSections = [
  'npc-characters',
  'map-builder',
  'story-pins',
  'game-timeline',
] as const

export type CampaignChatSection = (typeof campaignChatSections)[number]

export type CampaignChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: CampaignChatRole
  content: string
  createdAt: string
  isError?: boolean
  retrySourceUserMessageId?: string
}

export type ChatStoreState = Record<CampaignChatSection, ChatMessage[]>

export interface SendCampaignChatInput {
  section: CampaignChatSection
  messages: ChatMessage[]
  systemPrompt: string
}

export interface SendCampaignChatResult {
  reply: string
}

export interface PromptBuilderInput {
  section: CampaignChatSection
  state: AppState
}
