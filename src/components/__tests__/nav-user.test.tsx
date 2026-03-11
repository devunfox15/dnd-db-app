import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { NavUser } from '@/components/nav-user'
import { SidebarProvider } from '@/components/ui/sidebar'

describe('NavUser', () => {
  it('centers the profile trigger in collapsed sidebar mode', () => {
    const markup = renderToStaticMarkup(
      <SidebarProvider>
        <NavUser
          user={{
            name: 'shadcn',
            email: 'm@example.com',
            avatar: '/avatars/shadcn.jpg',
          }}
        />
      </SidebarProvider>,
    )

    expect(markup).toContain('group-data-[collapsible=icon]:justify-center')
    expect(markup).toContain('group-data-[collapsible=icon]:mx-auto')
  })
})
