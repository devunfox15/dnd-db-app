import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'
import { useAppState } from '@/features/core/store'

export const Route = createFileRoute('/campaigns')({
  component: RouteComponent,
})

function RouteComponent() {
  const state = useAppState()
  const location = useLocation()
  const path = location.pathname
  const legacySectionLabelByPath: Record<string, string> = {
    '/campaigns/npc-characters': 'NPC Characters',
    '/campaigns/map-builder': 'Map Builder',
    '/campaigns/story': 'Story',
  }
  const workspaceLabelByKey: Record<string, string> = {
    'scene-notes': 'Scene Notes',
    npcs: 'NPCs',
    locations: 'Locations',
    encounters: 'Encounters',
    secrets: 'Secrets',
    'session-board': 'Session Board',
  }
  const databaseLabelByKey: Record<string, string> = {
    'npc-database': 'NPC Database',
    'location-database': 'Location Database',
    'encounter-library': 'Encounter Library',
    'lore-secrets-database': 'Lore / Secrets Database',
  }
  const campaignSectionMatch = path.match(/^\/campaigns\/([^/]+)\/(.+)$/)
  const campaignOnlyMatch = path.match(/^\/campaigns\/([^/]+)\/?$/)

  const breadcrumbItems = (() => {
    if (path === '/campaigns') {
      return [{ label: 'Campaigns' }]
    }
    if (legacySectionLabelByPath[path]) {
      return [
        { label: 'Campaigns', href: '/campaigns' },
        { label: legacySectionLabelByPath[path] },
      ]
    }

    if (campaignOnlyMatch?.[1]) {
      const campaignId = campaignOnlyMatch[1]
      const campaign = state.campaigns.find((item) => item.id === campaignId)
      return [
        { label: 'Campaigns', href: '/campaigns' },
        { label: campaign?.name ?? campaignId },
      ]
    }

    if (campaignSectionMatch?.[1]) {
      const campaignId = campaignSectionMatch[1]
      const sectionPath = campaignSectionMatch[2]
      const campaign = state.campaigns.find((item) => item.id === campaignId)

      const workspaceMatch = sectionPath.match(/^workspace\/([^/]+)$/)
      const workspaceLabel = workspaceMatch
        ? workspaceLabelByKey[workspaceMatch[1]]
        : null
      const databaseLabel = databaseLabelByKey[sectionPath]

      return [
        { label: 'Campaigns', href: '/campaigns' },
        { label: campaign?.name ?? campaignId },
        ...(workspaceLabel
          ? [
              { label: 'Session Workspace' },
              { label: workspaceLabel },
            ]
          : []),
        ...(databaseLabel ? [{ label: databaseLabel }] : []),
      ]
    }

    return [{ label: 'Campaigns' }]
  })()

  return (
    <DmAppLayout
      pageTitle={
        breadcrumbItems[breadcrumbItems.length - 1]?.label ?? 'Campaigns'
      }
      breadcrumbItems={breadcrumbItems}
    >
      <Outlet />
    </DmAppLayout>
  )
}
