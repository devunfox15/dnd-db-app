import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { DmAppLayout } from '@/components/layout/dm-app-layout'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
  }: {
    children: unknown
    to: string
  }) => <a href={to}>{children}</a>,
  useLocation: () => ({ pathname: '/campaigns/1/workspace/npcs' }),
}))

vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({
    theme: 'system',
    resolvedTheme: 'light',
    setTheme: vi.fn(),
  }),
}))

vi.mock('@/components/app-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar</div>,
}))

vi.mock('@/features/dice-roller/components/dice-tray', () => ({
  DiceTray: () => <div data-testid="dice-tray">Dice Tray</div>,
}))

describe('DmAppLayout', () => {
  it('keeps the header outside the scrollable content area', () => {
    const markup = renderToStaticMarkup(
      <DmAppLayout
        pageTitle="NPCs"
        breadcrumbItems={[{ label: 'Campaign', href: '/campaigns/1' }, 'NPCs']}
      >
        <div>Page body</div>
      </DmAppLayout>,
    )

    expect(markup).not.toContain('sticky')
    expect(markup).not.toContain('top-0')
    expect(markup).toContain('bg-background')
    expect(markup).toContain('min-h-svh')
    expect(markup).toContain('overflow-hidden')
    expect(markup).toContain('min-h-0')
    expect(markup).toContain('overflow-y-auto')
    expect(markup).toContain('md:peer-data-[variant=inset]:mt-0')
  })
})
