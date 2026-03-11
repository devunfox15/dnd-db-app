import { describe, expect, it } from 'vitest'

import { getStoredSidebarOpen } from '@/components/ui/sidebar'

describe('getStoredSidebarOpen', () => {
  it('returns the persisted collapsed state from the sidebar cookie', () => {
    Object.defineProperty(globalThis, 'document', {
      value: {
        cookie: 'theme=dark; sidebar_state=false',
      },
      configurable: true,
    })

    expect(getStoredSidebarOpen()).toBe(false)
  })

  it('falls back when no sidebar cookie exists', () => {
    Object.defineProperty(globalThis, 'document', {
      value: {
        cookie: 'theme=dark',
      },
      configurable: true,
    })

    expect(getStoredSidebarOpen()).toBeUndefined()
  })
})
