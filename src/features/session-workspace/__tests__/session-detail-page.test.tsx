// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createElement } from 'react'

import { createEmptyState } from '@/features/core/migrations'
import { resetRepositoryStateForTests } from '@/features/core/repository'
import SessionDetailPage from '@/features/session-workspace/session-detail-page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/features/session-workspace/dm-screen-page', () => ({
  default: () => <div data-testid="dm-screen-stub">dm screen</div>,
}))
vi.mock('@/features/session-workspace/monster-picker', () => ({
  default: () => null,
}))
vi.mock('@/features/session-workspace/session-npc-roster', () => ({
  default: () => null,
}))
vi.mock('@/features/session-workspace/session-party-panel', () => ({
  default: () => null,
}))

const campaignId = 'campaign-1'
const sessionId = 'session-1'

function seedCampaign() {
  const state = createEmptyState()
  const now = new Date().toISOString()
  state.campaigns = [
    {
      id: campaignId,
      campaignId,
      name: 'Test Campaign',
      description: '',
      rpgSystem: 'dnd-5e',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
  ]
  state.activeCampaignId = campaignId
  resetRepositoryStateForTests(state)

  const sessionsKey = `dnd-db.workspace.sessions.${campaignId}`
  window.localStorage.setItem(
    sessionsKey,
    JSON.stringify({
      sessions: [
        {
          id: sessionId,
          title: 'The Broken Anvil',
          description: '',
          sessionNumber: 1,
          createdAt: now,
        },
      ],
    }),
  )
}

describe('SessionDetailPage', () => {
  beforeEach(() => {
    seedCampaign()
  })

  it('renders the session title and the planner, dm-screen, and log tab labels', () => {
    try {
      render(createElement(SessionDetailPage, { campaignId, sessionId }))
      expect(screen.getByText('The Broken Anvil')).toBeDefined()
      expect(screen.getByText('Planner')).toBeDefined()
      expect(screen.getByText('DM Screen')).toBeDefined()
      expect(screen.getByText('Log')).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('renders not-found when the session id is unknown', () => {
    try {
      render(
        createElement(SessionDetailPage, { campaignId, sessionId: 'missing' }),
      )
      expect(screen.getByText(/session not found/i)).toBeDefined()
    } finally {
      cleanup()
    }
  })
})
