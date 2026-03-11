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
    '/campaigns/story': 'Story',
  }
  const workspaceLabelBySegment: Record<string, string> = {
    sessions: 'Sessions',
    'player-characters': 'Player Characters',
    npcs: 'NPCs',
    locations: 'Locations',
    'scene-notes': 'Scene Notes',
    encounters: 'Encounters',
    secrets: 'Secrets',
    'dm-screen': 'DM Screen',
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
      const campaignName = campaign?.name ?? campaignId
      const campaignHref = `/campaigns/${campaignId}`
      const sessionsHref = `/campaigns/${campaignId}/workspace/sessions`

      // /workspace/sessions/$sessionId
      const sessionDetailMatch = sectionPath.match(/^workspace\/sessions\/([^/]+)$/)
      if (sessionDetailMatch) {
        const sessionId = sessionDetailMatch[1]
        let sessionTitle = 'Session'
        try {
          const raw = localStorage.getItem(`dnd-db.workspace.sessions.${campaignId}`)
          if (raw) {
            const parsed = JSON.parse(raw) as { sessions: { id: string; title: string }[] }
            sessionTitle = parsed.sessions.find((s) => s.id === sessionId)?.title ?? 'Session'
          }
        } catch {}
        return [
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaignName, href: campaignHref },
          { label: 'Workspace', href: sessionsHref },
          { label: 'Sessions', href: sessionsHref },
          { label: sessionTitle },
        ]
      }

      // /workspace/$section
      const workspaceMatch = sectionPath.match(/^workspace\/([^/]+)$/)
      if (workspaceMatch) {
        const sectionLabel = workspaceLabelBySegment[workspaceMatch[1]]
        if (sectionLabel) {
          return [
            { label: 'Campaigns', href: '/campaigns' },
            { label: campaignName, href: campaignHref },
            { label: 'Workspace', href: sessionsHref },
            { label: sectionLabel },
          ]
        }
      }

      const playerCharacterDetailMatch = sectionPath.match(
        /^workspace\/player-characters\/([^/]+)$/
      )
      if (playerCharacterDetailMatch) {
        const playerCharacterId = playerCharacterDetailMatch[1]
        const playerCharacter = state.playerCharacters.find(
          (entry) => entry.id === playerCharacterId
        )
        return [
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaignName, href: campaignHref },
          { label: 'Workspace', href: sessionsHref },
          {
            label: 'Player Characters',
            href: `/campaigns/${campaignId}/workspace/player-characters`,
          },
          { label: playerCharacter?.name ?? 'Character' },
        ]
      }

      // /workspace (index)
      if (sectionPath === 'workspace' || sectionPath === 'workspace/') {
        return [
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaignName, href: campaignHref },
          { label: 'Workspace' },
        ]
      }

      return [
        { label: 'Campaigns', href: '/campaigns' },
        { label: campaignName },
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
