import { Navigate, createFileRoute } from '@tanstack/react-router'

import { useActiveCampaignId } from '@/features/core/store'

export const Route = createFileRoute('/campaigns/story')({
  component: RouteComponent,
})

function RouteComponent() {
  const campaignId = useActiveCampaignId()

  if (!campaignId) {
    return <Navigate to="/campaigns" replace />
  }

  return (
    <Navigate
      to="/campaigns/$campaignId/lore-secrets-database"
      params={{ campaignId }}
      replace
    />
  )
}
