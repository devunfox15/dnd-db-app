import { Navigate, createFileRoute } from '@tanstack/react-router'

import { useActiveCampaignId } from '@/features/core/store'

export const Route = createFileRoute('/campaigns/map-builder')({
  component: RouteComponent,
})

function RouteComponent() {
  const campaignId = useActiveCampaignId()

  if (!campaignId) {
    return <Navigate to="/campaigns" replace />
  }

  return (
    <Navigate
      to="/campaigns/$campaignId/location-database"
      params={{ campaignId }}
      replace
    />
  )
}
