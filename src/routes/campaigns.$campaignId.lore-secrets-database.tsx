import { createFileRoute } from '@tanstack/react-router'

import StoryPinsPage from '@/features/story-pins/page'

export const Route = createFileRoute('/campaigns/$campaignId/lore-secrets-database')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()

  return (
    <StoryPinsPage
      campaignIdOverride={campaignId}
      title="Lore / Secrets Database"
      createLabel="Create Secret"
    />
  )
}
