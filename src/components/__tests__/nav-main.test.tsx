import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { Compass } from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

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
  useLocation: () => ({ pathname: '/campaigns' }),
}))

describe('NavMain', () => {
  it('renders premium active-state and collapsed-rail styling hooks', () => {
    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <SidebarProvider>
          <NavMain
            items={[{ title: 'Campaigns', url: '/campaigns', icon: Compass }]}
          />
        </SidebarProvider>
      </TooltipProvider>,
    )

    expect(markup).toContain('data-active="true"')
    expect(markup).toContain('group-data-[collapsible=icon]:size-10!')
    expect(markup).toContain('group-data-[collapsible=icon]:justify-center')
    expect(markup).toContain('group-data-[collapsible=icon]:hidden')
    expect(markup).toContain('data-router-link="true"')
  })
})
