import { Navigate, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/$campaignId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()

  return (
    <Navigate
      to="/campaigns/$campaignId/workspace/scene-notes"
      params={{ campaignId }}
      replace
    />
  )
}
