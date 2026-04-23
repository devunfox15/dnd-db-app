// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { createElement } from 'react'

// React 19 + Vitest: enable act environment so hooks work under jsdom
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

import { EntryCard } from '@/features/session-log/entry-card'
import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'
import type { SessionLogEntry } from '@/features/core/types'

const campaignId = 'campaign-1'

function seedEntry(): SessionLogEntry {
  resetRepositoryStateForTests(createEmptyState())
  const created = appRepository.create('sessionLog', {
    campaignId,
    kind: 'note',
    title: 'Opening Scene',
    body: 'Party arrives at Greenhollow',
    timestamp: new Date().toISOString(),
  })
  return created
}

describe('EntryCard', () => {
  let entry: SessionLogEntry = null as unknown as SessionLogEntry

  beforeEach(() => {
    entry = seedEntry()
  })

  it('renders the entry title, body, and kind badge', () => {
    try {
      render(createElement(EntryCard, { entry }))
      expect(screen.getByText('Opening Scene')).toBeDefined()
      expect(screen.getByText('Party arrives at Greenhollow')).toBeDefined()
      expect(screen.getByText(/note/i)).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('enters edit mode when Edit is clicked and saves via the repository', () => {
    try {
      render(createElement(EntryCard, { entry }))
      fireEvent.click(screen.getByRole('button', { name: /edit/i }))

      const titleInput = screen.getByPlaceholderText(/title/i) as HTMLInputElement
      fireEvent.change(titleInput, { target: { value: 'Revised Title' } })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      const refreshed = appRepository
        .list('sessionLog')
        .find((item) => item.id === entry.id)
      expect(refreshed?.title).toBe('Revised Title')
    } finally {
      cleanup()
    }
  })

  it('deletes the entry via the repository when Delete is confirmed', () => {
    try {
      render(createElement(EntryCard, { entry }))
      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }))

      const remaining = appRepository
        .list('sessionLog')
        .find((item) => item.id === entry.id)
      expect(remaining).toBeUndefined()
    } finally {
      cleanup()
    }
  })
})
