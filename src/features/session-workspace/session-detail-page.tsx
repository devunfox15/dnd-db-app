import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Monitor, ScrollText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import DmScreenPage from '@/features/session-workspace/dm-screen-page'
import { SessionPlannerView } from '@/features/session-workspace/session-planner-view'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

// ─── Local Types ──────────────────────────────────────────────────────────────

interface Session {
  id: string
  title: string
  description: string
  sessionNumber: number
  createdAt: string
}

interface SessionsState {
  sessions: Session[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

type ViewTab = 'planner' | 'dm-screen'

const tabs: { id: ViewTab; label: string; icon: LucideIcon }[] = [
  { id: 'planner', label: 'Planner', icon: ScrollText },
  { id: 'dm-screen', label: 'DM Screen', icon: Monitor },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SessionDetailPage({
  campaignId,
  sessionId,
}: {
  campaignId: string
  sessionId: string
}) {
  const [sessionsState] = useCampaignStorageState<SessionsState>(
    campaignId,
    'sessions',
    { sessions: [] },
  )

  const [activeTab, setActiveTab] = useState<ViewTab>('planner')

  const session = useMemo(
    () => sessionsState.sessions.find((s) => s.id === sessionId) ?? null,
    [sessionsState.sessions, sessionId],
  )

  if (!session) {
    return (
      <div className="space-y-4">
        <Link
          to="/campaigns/$campaignId/workspace/sessions"
          params={{ campaignId }}
        >
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5">
            <ArrowLeft className="size-4" />
            Back to sessions
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground">Session not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Tabs */}
      <div className="flex items-center gap-3">
        <Link
          to="/campaigns/$campaignId/workspace/sessions"
          params={{ campaignId }}
        >
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5">
            <ArrowLeft className="size-4" />
            Sessions
          </Button>
        </Link>

        <h1 className="min-w-0 flex-1 truncate text-base font-semibold">
          {session.title}
        </h1>

        <div className="flex shrink-0 gap-1 rounded-lg border bg-muted/40 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'planner' && (
        <SessionPlannerView campaignId={campaignId} sessionId={sessionId} />
      )}

      {activeTab === 'dm-screen' && (
        <DmScreenPage campaignId={campaignId} sessionId={sessionId} />
      )}
    </div>
  )
}
