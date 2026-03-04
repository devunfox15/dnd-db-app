import { describe, expect, it } from 'vitest'

import { buildCampaignSectionSystemPrompt } from '@/features/campaign-chat/prompt-builder'
import { createSampleState } from '@/features/core/sample-data'

describe('buildCampaignSectionSystemPrompt', () => {
  it('includes NPC-focused guidance for npc-characters section', () => {
    const prompt = buildCampaignSectionSystemPrompt({
      section: 'npc-characters',
      state: createSampleState(1),
    })

    expect(prompt).toContain('creating and refining NPCs')
    expect(prompt).toContain('roleplay hooks')
  })

  it('includes map-focused guidance for map-builder section', () => {
    const prompt = buildCampaignSectionSystemPrompt({
      section: 'map-builder',
      state: createSampleState(1),
    })

    expect(prompt).toContain('world areas')
    expect(prompt).toContain('encounter geography')
  })

  it('includes story-pin-focused guidance for story-pins section', () => {
    const prompt = buildCampaignSectionSystemPrompt({
      section: 'story-pins',
      state: createSampleState(1),
    })

    expect(prompt).toContain('story details')
    expect(prompt).toContain('setup/payoff')
  })

  it('includes timeline-focused guidance for game-timeline section', () => {
    const prompt = buildCampaignSectionSystemPrompt({
      section: 'game-timeline',
      state: createSampleState(1),
    })

    expect(prompt).toContain('timeline milestones')
    expect(prompt).toContain('foreshadowing')
  })
})
