import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
} from '@tanstack/react-router'
import {
  CalendarDays,
  NotebookPen,
  Users,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

const workspaceLinks: {
  label: string
  to: string
  icon: LucideIcon
  segment: string
}[] = [
  {
    label: 'Sessions',
    to: '/campaigns/$campaignId/workspace/sessions',
    icon: CalendarDays,
    segment: 'sessions',
  },
  {
    label: 'Player Characters',
    to: '/campaigns/$campaignId/workspace/player-characters',
    icon: UserRound,
    segment: 'player-characters',
  },
  {
    label: 'NPCs',
    to: '/campaigns/$campaignId/workspace/npcs',
    icon: Users,
    segment: 'npcs',
  },
  {
    label: 'Session Log',
    to: '/campaigns/$campaignId/workspace/log',
    icon: NotebookPen,
    segment: 'log',
  },
]

export const Route = createFileRoute('/campaigns/$campaignId/workspace')({
  component: RouteComponent,
})

export function RouteComponent() {
  const { campaignId } = Route.useParams()
  const location = useLocation()

  // Show nav only on the four top-level workspace pages (not deeper routes like /$sessionId)
  // Top-level paths have exactly 5 segments: /campaigns/X/workspace/section
  const segments = location.pathname.replace(/\/$/, '').split('/')
  const showNav = segments.length === 5 && segments[3] === 'workspace'

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {showNav && (
        <div className="shrink-0">
          <div className="inline-flex items-center gap-1 rounded-xl border bg-card p-1 shadow-sm">
            {workspaceLinks.map((link) => {
              const Icon = link.icon
              const active =
                location.pathname ===
                  link.to.replace('$campaignId', campaignId) ||
                location.pathname ===
                  link.to.replace('$campaignId', campaignId) + '/'
              return (
                <Link key={link.segment} to={link.to} params={{ campaignId }}>
                  <span
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    {link.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
