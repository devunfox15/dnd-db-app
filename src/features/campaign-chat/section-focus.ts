import type { CampaignChatSection } from '@/features/campaign-chat/types'

export const campaignAssistantBaseline =
  'You are a campaign planning co-DM assistant focused on coherent storytelling, continuity, and practical prep for tabletop sessions.'

export const sectionFocusPrompt: Record<CampaignChatSection, string> = {
  'npc-characters':
    'Focus on creating and refining NPCs, including motivation, roleplay hooks, factions, secrets, personality, and long-term arcs.',
  'story-pins':
    'Focus on strengthening story details, hooks, twists, clues, setup/payoff, and ways to make pins reusable and actionable in sessions.',
  'game-timeline':
    'Focus on timeline milestones, pacing, foreshadowing, session beats, major turning points, and key campaign progression events.',
}

export function sectionLabel(section: CampaignChatSection): string {
  switch (section) {
    case 'npc-characters':
      return 'NPC Characters'
    case 'story-pins':
      return 'Story Pins'
    case 'game-timeline':
      return 'Game Timeline'
    default:
      return 'Campaign'
  }
}
