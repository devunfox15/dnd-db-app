import { useEffect, useMemo } from 'react'
import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { appRepository, useAppState } from '@/features/core/store'

const sessionWorkspaceLinks = [
  {
    label: 'Scene Notes',
    to: '/campaigns/$campaignId/workspace/scene-notes' as const,
  },
  {
    label: 'NPCs',
    to: '/campaigns/$campaignId/workspace/npcs' as const,
  },
  {
    label: 'Locations',
    to: '/campaigns/$campaignId/workspace/locations' as const,
  },
  {
    label: 'Encounters',
    to: '/campaigns/$campaignId/workspace/encounters' as const,
  },
  {
    label: 'Secrets',
    to: '/campaigns/$campaignId/workspace/secrets' as const,
  },
  {
    label: 'Session Board',
    to: '/campaigns/$campaignId/workspace/session-board' as const,
  },
]

const databaseLinks = [
  {
    label: 'NPC Database',
    to: '/campaigns/$campaignId/npc-database' as const,
  },
  {
    label: 'Location Database',
    to: '/campaigns/$campaignId/location-database' as const,
  },
  {
    label: 'Encounter Library',
    to: '/campaigns/$campaignId/encounter-library' as const,
  },
  {
    label: 'Lore / Secrets Database',
    to: '/campaigns/$campaignId/lore-secrets-database' as const,
  },
]

export const Route = createFileRoute('/campaigns/$campaignId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  const location = useLocation()
  const state = useAppState()
  const campaign = useMemo(
    () => state.campaigns.find((item) => item.id === campaignId) ?? null,
    [campaignId, state.campaigns],
  )

  useEffect(() => {
    if (campaign && state.activeCampaignId !== campaign.id) {
      appRepository.setActiveCampaign(campaign.id)
    }
  }, [campaign?.id, state.activeCampaignId])

  if (!campaign) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>No campaign exists with ID: {campaignId}</p>
          <div>
            <a className="underline underline-offset-2" href="/campaigns">
              Back to campaigns dashboard
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[270px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{campaign.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">
              Session Workspace
            </p>
            {sessionWorkspaceLinks.map((link) => {
              const active = location.pathname === link.to.replace('$campaignId', campaignId)

              return (
                <Link
                  key={link.label}
                  to={link.to}
                  params={{ campaignId }}
                  className="block"
                >
                  <Button
                    variant={active ? 'default' : 'outline'}
                    className="w-full justify-start"
                  >
                    {link.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Databases</p>
            {databaseLinks.map((link) => {
              const active = location.pathname === link.to.replace('$campaignId', campaignId)

              return (
                <Link
                  key={link.label}
                  to={link.to}
                  params={{ campaignId }}
                  className="block"
                >
                  <Button
                    variant={active ? 'default' : 'outline'}
                    className="w-full justify-start"
                  >
                    {link.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
