import { useEffect, useMemo } from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { appRepository, useAppState } from '@/features/core/store'

export const Route = createFileRoute('/campaigns/$campaignId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
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
      <div className="space-y-3 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Campaign Not Found</p>
        <p>No campaign exists with ID: {campaignId}</p>
        <a className="underline underline-offset-2" href="/campaigns">
          Back to campaigns dashboard
        </a>
      </div>
    )
  }

  return <Outlet />
}
