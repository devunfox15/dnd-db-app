// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { createElement } from 'react'

import { KindFilter } from '@/features/session-log/kind-filter'

describe('KindFilter', () => {
  it('renders All, Notes, Events, Secrets buttons', () => {
    try {
      render(createElement(KindFilter, { value: 'all', onChange: () => {} }))
      expect(screen.getByRole('button', { name: /all/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /^notes$/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /events/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /secrets/i })).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('calls onChange with the clicked kind', () => {
    const spy = vi.fn()
    try {
      render(createElement(KindFilter, { value: 'all', onChange: spy }))
      fireEvent.click(screen.getByRole('button', { name: /events/i }))
      expect(spy).toHaveBeenCalledWith('event')
    } finally {
      cleanup()
    }
  })
})
