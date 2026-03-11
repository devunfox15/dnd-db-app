import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: unknown
    to: string
    className?: string
    [key: string]: unknown
  }) => <a data-router-link="true" href={to} {...props}>{children}</a>,
}))

vi.mock('@/components/nav-main', () => ({
  NavMain: () => <div data-testid="nav-main">Nav</div>,
}))

vi.mock('@/components/nav-user', () => ({
  NavUser: () => <div data-testid="nav-user">User</div>,
}))

describe('AppSidebar', () => {
  it('uses the same 64px header frame as the top breadcrumb bar', () => {
    const markup = renderToStaticMarkup(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    )

    expect(markup).toContain('data-slot="sidebar-header"')
    expect(markup).toContain('h-16')
    expect(markup).toContain('p-0')
    expect(markup).toContain('Dream ToolKit')
    expect(markup).toContain('RPG Campaign')
    expect(markup).toContain('group-data-[collapsible=icon]:justify-center')
    expect(markup).toContain('data-router-link="true"')
  })
})
