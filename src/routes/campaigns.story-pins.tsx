import { createFileRoute } from '@tanstack/react-router'

import FeaturePage from '@/features/story-pins/page'

export const Route = createFileRoute('/campaigns/story-pins')({
  component: RouteComponent,
})

function RouteComponent() {
  return <FeaturePage />
}
