import { useState } from 'react'
import { Monitor, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import SessionDmPartyPanel from '@/features/session-workspace/session-dm-party-panel'
import { SessionDmScreenTab } from '@/features/session-workspace/session-dm-screen-tab'
import { SessionDmTimer } from '@/features/session-workspace/session-dm-timer'

type DmTab = 'screen' | 'party'

const dmTabs: { id: DmTab; label: string; icon: LucideIcon }[] = [
  { id: 'screen', label: 'Screen', icon: Monitor },
  { id: 'party', label: 'Party', icon: Users },
]

interface DmScreenPageProps {
  campaignId: string
  sessionId?: string
}

export default function DmScreenPage({
  campaignId,
  sessionId,
}: DmScreenPageProps) {
  const [dmTab, setDmTab] = useState<DmTab>('screen')

  if (!sessionId) {
    return (
      <p className="text-sm text-muted-foreground">
        DM Screen requires a session context.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab bar with timer on the right */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex w-fit gap-1 rounded-lg border bg-muted/40 p-1">
          {dmTabs.map((tab) => {
            const Icon = tab.icon
            const active = dmTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setDmTab(tab.id)}
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

        <SessionDmTimer campaignId={campaignId} sessionId={sessionId} />
      </div>

      {dmTab === 'screen' && (
        <SessionDmScreenTab campaignId={campaignId} sessionId={sessionId} />
      )}

      {dmTab === 'party' && (
        <SessionDmPartyPanel campaignId={campaignId} sessionId={sessionId} />
      )}
    </div>
  )
}
