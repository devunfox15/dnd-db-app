import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/campaigns/$campaignId/workspace/player-characters',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
