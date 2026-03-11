import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const mockUseLocation = vi.hoisted(() => vi.fn())
const mockUseParams = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>()

  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: unknown
      to: string
      [key: string]: unknown
    }) => <a href={to} {...props}>{children}</a>,
    Outlet: () => <div data-testid="workspace-outlet">Outlet</div>,
    createFileRoute: () =>
      (config: Record<string, unknown>) => ({
        ...config,
        useParams: mockUseParams,
      }),
    useLocation: mockUseLocation,
  }
})

import { RouteComponent as WorkspaceRouteComponent } from '@/routes/campaigns.$campaignId.workspace'

describe('campaign workspace route shell', () => {
  it('keeps the workspace tab row outside the scrollable content area', () => {
    mockUseParams.mockReturnValue({ campaignId: '1' })
    mockUseLocation.mockReturnValue({
      pathname: '/campaigns/1/workspace/sessions',
    })

    const markup = renderToStaticMarkup(<WorkspaceRouteComponent />)

    expect(markup).toContain('Sessions')
    expect(markup).toContain('Player Characters')
    expect(markup).toContain('NPCs')
    expect(markup).toContain('Locations')
    expect(markup).toContain('overflow-y-auto')
    expect(markup).toContain('shrink-0')
  })

  it('hides the workspace tab row on deeper workspace routes', () => {
    mockUseParams.mockReturnValue({ campaignId: '1' })
    mockUseLocation.mockReturnValue({
      pathname: '/campaigns/1/workspace/sessions/session-1',
    })

    const markup = renderToStaticMarkup(<WorkspaceRouteComponent />)

    expect(markup).not.toContain('Player Characters')
    expect(markup).toContain('workspace-outlet')
  })
})
