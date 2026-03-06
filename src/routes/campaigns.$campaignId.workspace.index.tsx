import { Navigate, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()

  return (
    <Navigate
      to="/campaigns/$campaignId/workspace/sessions"
      params={{ campaignId }}
      replace
    />
  )
}
