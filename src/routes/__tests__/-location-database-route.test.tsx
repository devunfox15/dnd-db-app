import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const mockUseParams = vi.hoisted(() => vi.fn())
const mockNavigate = vi.hoisted(
  () =>
    vi.fn(({ to }: { to: string }) => <div data-to={to}>Redirect</div>),
)

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>()

  return {
    ...actual,
    Navigate: mockNavigate,
    createFileRoute: () =>
      (config: Record<string, unknown>) => ({
        ...config,
        useParams: mockUseParams,
      }),
  }
})

import { RouteComponent } from '@/routes/campaigns.$campaignId.location-database'

describe('location database route', () => {
  it('redirects legacy location-database traffic to workspace locations', () => {
    mockUseParams.mockReturnValue({ campaignId: 'campaign-1' })

    const markup = renderToStaticMarkup(<RouteComponent />)

    expect(markup).toContain('Redirect')
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/campaigns/$campaignId/workspace/locations',
        params: { campaignId: 'campaign-1' },
        replace: true,
      }),
      undefined,
    )
  })
})
