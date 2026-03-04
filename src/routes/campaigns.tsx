import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'

export const Route = createFileRoute('/campaigns')({
  component: RouteComponent,
})

function RouteComponent() {
  const location = useLocation()
  const path = location.pathname
  const campaignMatch = path.match(/^\/campaigns\/([^/]+)$/)
  const sectionLabelByPath: Record<string, string> = {
    '/campaigns/npc-characters': 'NPC Characters',
    '/campaigns/game-timeline': 'Game Timeline',
    '/campaigns/map-builder': 'Map Builder',
    '/campaigns/story-pins': 'Story Pins',
  }

  const breadcrumbItems = (() => {
    if (path === '/campaigns') {
      return ['Campaigns']
    }
    if (sectionLabelByPath[path]) {
      return ['Campaigns', sectionLabelByPath[path]]
    }
    if (campaignMatch?.[1]) {
      return ['Campaigns', `Campaign ${campaignMatch[1]}`]
    }
    return ['Campaigns']
  })()

  return (
    <DmAppLayout pageTitle={breadcrumbItems[breadcrumbItems.length - 1] ?? 'Campaigns'} breadcrumbItems={breadcrumbItems}>
      <Outlet />
    </DmAppLayout>
  )
}
