// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { createElement } from 'react'

import SessionLogListPage from '@/features/session-log/list-page'
import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}))

const campaignId = 'campaign-1'

function seedBase() {
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
}

describe('SessionLogListPage', () => {
  beforeEach(() => {
    seedBase()
  })

  it('renders an empty state when no entries exist', () => {
    try {
      render(createElement(SessionLogListPage, { campaignId }))
      expect(screen.getByText(/no log entries/i)).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('renders all entries by default and filters by kind', () => {
    appRepository.create('sessionLog', {
      campaignId,
      kind: 'note',
      title: 'Greenhollow',
      body: 'Frontier town',
      timestamp: new Date().toISOString(),
    })
    appRepository.create('sessionLog', {
      campaignId,
      kind: 'secret',
      title: 'Buried gold',
      body: 'Under the chapel',
      timestamp: new Date().toISOString(),
    })

    try {
      render(createElement(SessionLogListPage, { campaignId }))
      expect(screen.getByText('Greenhollow')).toBeDefined()
      expect(screen.getByText('Buried gold')).toBeDefined()

      fireEvent.click(screen.getByRole('button', { name: /secrets/i }))
      expect(screen.queryByText('Greenhollow')).toBeNull()
      expect(screen.getByText('Buried gold')).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('creates an entry via the inline form', () => {
    try {
      render(createElement(SessionLogListPage, { campaignId }))

      fireEvent.click(screen.getByRole('button', { name: /new entry/i }))

      const titleInput = screen.getByPlaceholderText(/title/i) as HTMLInputElement
      fireEvent.change(titleInput, { target: { value: 'Session Recap' } })

      fireEvent.click(screen.getByRole('button', { name: /^add$/i }))

      const created = appRepository
        .list('sessionLog')
        .find((entry) => entry.title === 'Session Recap')
      expect(created).toBeDefined()
      expect(created?.campaignId).toBe(campaignId)
      expect(created?.kind).toBe('note')
    } finally {
      cleanup()
    }
  })
})
