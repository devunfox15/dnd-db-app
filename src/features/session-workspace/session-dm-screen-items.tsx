import { EyeOff, Gift, Link2, ScrollText, Swords } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useCampaignStorageState } from '@/features/session-workspace/storage'
import type {
  SessionPlanItem,
  SessionPlanState,
} from '@/features/session-workspace/session-types'

interface SessionDmScreenItemsProps {
  campaignId: string
  sessionId: string
}

const kindMeta: Record<
  SessionPlanItem['kind'],
  { label: string; accent: string; icon: LucideIcon }
> = {
  scene: { label: 'Scene', accent: 'bg-indigo-500', icon: ScrollText },
  encounter: { label: 'Encounter', accent: 'bg-red-500', icon: Swords },
  secret: { label: 'Secret', accent: 'bg-amber-500', icon: EyeOff },
  reward: { label: 'Reward', accent: 'bg-yellow-500', icon: Gift },
  hook: { label: 'Hook', accent: 'bg-green-500', icon: Link2 },
}

function itemTitle(item: SessionPlanItem): string {
  switch (item.kind) {
    case 'scene':
      return item.text || 'Untitled scene'
    case 'encounter':
      return `${item.count > 1 ? `×${item.count} ` : ''}${item.monsterName || 'Encounter'}`
    case 'secret':
      return item.title || 'Untitled secret'
    case 'reward':
      return item.title || 'Untitled reward'
    case 'hook':
      return item.title || 'Untitled hook'
  }
}

function ItemBody({ item }: { item: SessionPlanItem }) {
  switch (item.kind) {
    case 'scene':
      return (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {item.text || (
            <span className="italic text-muted-foreground">No scene notes.</span>
          )}
        </p>
      )
    case 'encounter':
      return (
        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-medium">Monster:</span> {item.monsterName}
            {item.count > 1 ? ` (×${item.count})` : ''}
          </p>
          {item.notes ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {item.notes}
            </p>
          ) : null}
        </div>
      )
    case 'secret':
      return (
        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-medium">{item.skill}</span> DC {item.dc}
          </p>
          {item.content ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {item.content}
            </p>
          ) : null}
        </div>
      )
    case 'reward':
      return (
        <div className="space-y-1 text-sm">
          {item.xp > 0 ? (
            <p>
              <span className="font-medium">XP:</span> {item.xp}
            </p>
          ) : null}
          {item.loot ? (
            <p>
              <span className="font-medium">Loot:</span> {item.loot}
            </p>
          ) : null}
          {item.notes ? (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {item.notes}
            </p>
          ) : null}
        </div>
      )
    case 'hook':
      return item.description ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {item.description}
        </p>
      ) : (
        <p className="text-sm italic text-muted-foreground">No hook details.</p>
      )
  }
}

export function SessionDmScreenItems({
  campaignId,
  sessionId,
}: SessionDmScreenItemsProps) {
  const [plan] = useCampaignStorageState<SessionPlanState>(
    campaignId,
    `session-plan-${sessionId}`,
    { items: [] },
  )

  if (plan.items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No session plan yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Items added in the Planner tab will appear here in order during the
          live session.
        </p>
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      {plan.items.map((item, index) => {
        const meta = kindMeta[item.kind]
        const Icon = meta.icon
        return (
          <li
            key={item.id}
            className="flex items-stretch rounded-lg border bg-card shadow-sm"
          >
            <div
              className={`flex w-8 shrink-0 items-center justify-center text-[10px] font-bold uppercase tracking-widest text-background ${meta.accent}`}
            >
              {index + 1}
            </div>
            <div className="min-w-0 flex-1 p-3">
              <div className="flex items-center gap-2">
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {meta.label}
                </span>
              </div>
              <p className="mt-1 font-medium leading-snug">{itemTitle(item)}</p>
              <div className="mt-2">
                <ItemBody item={item} />
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
