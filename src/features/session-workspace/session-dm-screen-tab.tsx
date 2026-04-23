import { useState } from 'react'
import { NotebookPen, ScrollText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import SessionLogListPage from '@/features/session-log/list-page'
import { SessionDmNotepad } from '@/features/session-workspace/session-dm-notepad'
import { SessionDmScreenItems } from '@/features/session-workspace/session-dm-screen-items'
import SessionInitiativeTracker from '@/features/session-workspace/session-initiative-tracker'

type RightPanelTab = 'notepad' | 'log'

const rightTabs: { id: RightPanelTab; label: string; icon: LucideIcon }[] = [
  { id: 'notepad', label: 'Notepad', icon: NotebookPen },
  { id: 'log', label: 'Game Log', icon: ScrollText },
]

interface SessionDmScreenTabProps {
  campaignId: string
  sessionId: string
}

export function SessionDmScreenTab({ campaignId, sessionId }: SessionDmScreenTabProps) {
  const [rightTab, setRightTab] = useState<RightPanelTab>('notepad')

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Left/center: planned items + initiative */}
      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Session Plan
          </h2>
          <SessionDmScreenItems campaignId={campaignId} sessionId={sessionId} />
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Initiative Tracker
          </h2>
          <SessionInitiativeTracker campaignId={campaignId} sessionId={sessionId} />
        </section>
      </div>

      {/* Right: notepad / game log tab switcher */}
      <div className="space-y-2">
        <div className="flex w-fit gap-1 rounded-lg border bg-muted/40 p-1">
          {rightTabs.map((tab) => {
            const Icon = tab.icon
            const active = rightTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
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

        {rightTab === 'notepad' ? (
          <SessionDmNotepad campaignId={campaignId} sessionId={sessionId} />
        ) : (
          <SessionLogListPage campaignId={campaignId} sessionId={sessionId} />
        )}
      </div>
    </div>
  )
}
