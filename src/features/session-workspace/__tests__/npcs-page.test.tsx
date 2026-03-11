import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WorkspaceNpcsPage from '@/features/session-workspace/npcs-page'
import { createEmptyState } from '@/features/core/migrations'
import { resetRepositoryStateForTests } from '@/features/core/repository'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
}))

describe('Workspace NPC page module', () => {
  beforeEach(() => {
    const state = createEmptyState()
    const now = new Date().toISOString()
    state.campaigns = [
      {
        id: 'campaign-1',
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        description: '',
        rpgSystem: 'dnd-5e',
        createdAt: now,
        updatedAt: now,
        tags: [],
      },
    ]
    state.npcs = [
      {
        id: 'npc-1',
        campaignId: 'campaign-1',
        name: 'Aelar',
        role: 'Scout',
        faction: '',
        notes: '',
        usedInMapIds: [],
        usedInTimelineEventIds: [],
        createdAt: now,
        updatedAt: now,
        tags: [],
      },
      {
        id: 'npc-2',
        campaignId: 'campaign-1',
        name: 'Brakka',
        role: '',
        faction: '',
        notes: '',
        usedInMapIds: [],
        usedInTimelineEventIds: [],
        createdAt: now,
        updatedAt: now,
        tags: [],
      },
    ]
    resetRepositoryStateForTests(state)
  })

  it('renders a session-style toolbar for workspace NPC cards', () => {
    const markup = renderToStaticMarkup(
      <WorkspaceNpcsPage campaignId="campaign-1" />,
    )

    expect(markup).toContain('placeholder="Search workspace NPCs"')
    expect(markup).toContain('>Add NPC<')
    expect(markup).toContain('>2<')
    expect(markup).not.toContain('Workspace NPC Cards')
    expect(markup).toContain('border-dashed')
  })
})
