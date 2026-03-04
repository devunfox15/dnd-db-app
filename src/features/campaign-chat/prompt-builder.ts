import { campaignAssistantBaseline, sectionFocusPrompt, sectionLabel } from '@/features/campaign-chat/section-focus'
import type { PromptBuilderInput } from '@/features/campaign-chat/types'

const RECENT_LIMIT = 5
const TEXT_LIMIT = 140

function trimText(value: string, max = TEXT_LIMIT): string {
  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized.length <= max ? normalized : `${normalized.slice(0, max)}...`
}

function byUpdatedAtDesc<T extends { updatedAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function formatList(lines: string[]): string {
  if (lines.length === 0) {
    return '- none'
  }

  return lines.map((line) => `- ${line}`).join('\n')
}

export function buildCampaignSectionSystemPrompt({ section, state }: PromptBuilderInput): string {
  const activeCampaign =
    state.activeCampaignId && state.campaigns.some((campaign) => campaign.id === state.activeCampaignId)
      ? state.campaigns.find((campaign) => campaign.id === state.activeCampaignId)
      : [...state.campaigns].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const campaign = activeCampaign
  const campaignName = campaign?.name ?? 'Unnamed Campaign'

  const summaryLines = [
    `Campaign: ${campaignName}`,
    `Section: ${sectionLabel(section)}`,
    `Counts => NPCs: ${state.npcs.length}, Maps: ${state.maps.length}, Story Pins: ${state.pins.length}, Timeline Events: ${state.timelineEvents.length}`,
  ]

  const recentNpcLines = byUpdatedAtDesc(state.npcs)
    .slice(0, RECENT_LIMIT)
    .map((npc) => `${trimText(npc.name, 60)} (${trimText(npc.role || 'No role', 60)})`)

  const recentMapLines = byUpdatedAtDesc(state.maps)
    .slice(0, RECENT_LIMIT)
    .map((map) => `${trimText(map.name, 60)} (${trimText(map.region || 'No region', 60)})`)

  const recentPinLines = byUpdatedAtDesc(state.pins)
    .slice(0, RECENT_LIMIT)
    .map((pin) => `${trimText(pin.title, 70)} [${pin.status}]`)

  const recentTimelineLines = byUpdatedAtDesc(state.timelineEvents)
    .slice(0, RECENT_LIMIT)
    .map((event) => `#${event.orderIndex} ${trimText(event.title, 70)} [${event.status}]`)

  const sectionContext = [
    'Recent NPCs:',
    formatList(recentNpcLines),
    'Recent Maps:',
    formatList(recentMapLines),
    'Recent Story Pins:',
    formatList(recentPinLines),
    'Recent Timeline Events:',
    formatList(recentTimelineLines),
  ].join('\n')

  return [
    campaignAssistantBaseline,
    sectionFocusPrompt[section],
    'Use concise, practical suggestions that a DM can apply immediately.',
    'If needed, suggest 2-3 concrete options and mention tradeoffs briefly.',
    summaryLines.join('\n'),
    sectionContext,
  ].join('\n\n')
}
