import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortableOperation } from '@dnd-kit/react/sortable'
import {
  ArrowLeft,
  EyeOff,
  Gift,
  Link2,
  Monitor,
  Plus,
  ScrollText,
  Swords,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCollection } from '@/features/core/store'
import { CollapsiblePanel } from '@/features/session-workspace/collapsible-panel'
import DmScreenPage from '@/features/session-workspace/dm-screen-page'
import {
  arrayMove,
  EncounterCard,
  HookCard,
  RewardCard,
  SceneCard,
  SecretCard,
  SortableItem,
} from '@/features/session-workspace/session-plan-cards'
import {
  AddEncounterForm,
  AddHookForm,
  AddRewardForm,
  AddSceneForm,
  AddSecretForm,
} from '@/features/session-workspace/session-plan-forms'
import SessionNpcRoster from '@/features/session-workspace/session-npc-roster'
import SessionPartyPanel from '@/features/session-workspace/session-party-panel'
import { useCampaignStorageState } from '@/features/session-workspace/storage'
import type {
  SessionNpcRosterState,
  SessionPlanItem,
  SessionPlanState,
} from '@/features/session-workspace/session-types'

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
type AddingKind = 'scene' | 'encounter' | 'secret' | 'reward' | 'hook' | null

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
  const [plan, setPlan] = useCampaignStorageState<SessionPlanState>(
    campaignId,
    `session-plan-${sessionId}`,
    { items: [] },
  )
  const [npcRoster] = useCampaignStorageState<SessionNpcRosterState>(
    campaignId,
    `session-npcs-${sessionId}`,
    { linkedNpcs: [] },
  )

  const players = useCollection('playerCharacters', { campaignId })
  const [activeTab, setActiveTab] = useState<ViewTab>('planner')
  const [addingKind, setAddingKind] = useState<AddingKind>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const session = useMemo(
    () => sessionsState.sessions.find((s) => s.id === sessionId) ?? null,
    [sessionsState.sessions, sessionId],
  )

  function addItem(item: SessionPlanItem) {
    setPlan((prev) => ({ items: [...prev.items, item] }))
    setAddingKind(null)
  }

  function deleteItem(id: string) {
    setPlan((prev) => ({ items: prev.items.filter((i) => i.id !== id) }))
  }

  const activeItem = activeId ? plan.items.find((i) => i.id === activeId) : null

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

      {/* Planner tab */}
      {activeTab === 'planner' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Left column: plan blocks */}
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={addingKind === 'encounter' ? 'default' : 'outline'}
                className="gap-1.5"
                onClick={() =>
                  setAddingKind(addingKind === 'encounter' ? null : 'encounter')
                }
              >
                <Swords className="size-3.5" />
                Encounter
                <Plus className="size-3" />
              </Button>
              <Button
                size="sm"
                variant={addingKind === 'scene' ? 'default' : 'outline'}
                className="gap-1.5"
                onClick={() =>
                  setAddingKind(addingKind === 'scene' ? null : 'scene')
                }
              >
                <ScrollText className="size-3.5" />
                Scene
                <Plus className="size-3" />
              </Button>
              <Button
                size="sm"
                variant={addingKind === 'secret' ? 'default' : 'outline'}
                className="gap-1.5"
                onClick={() =>
                  setAddingKind(addingKind === 'secret' ? null : 'secret')
                }
              >
                <EyeOff className="size-3.5" />
                Secret
                <Plus className="size-3" />
              </Button>
              <Button
                size="sm"
                variant={addingKind === 'reward' ? 'default' : 'outline'}
                className="gap-1.5"
                onClick={() =>
                  setAddingKind(addingKind === 'reward' ? null : 'reward')
                }
              >
                <Gift className="size-3.5" />
                Reward
                <Plus className="size-3" />
              </Button>
              <Button
                size="sm"
                variant={addingKind === 'hook' ? 'default' : 'outline'}
                className="gap-1.5"
                onClick={() =>
                  setAddingKind(addingKind === 'hook' ? null : 'hook')
                }
              >
                <Link2 className="size-3.5" />
                Hook
                <Plus className="size-3" />
              </Button>
            </div>

            {/* Sortable list */}
            <DragDropProvider
              onDragStart={(e) =>
                setActiveId(String(e.operation.source?.id ?? ''))
              }
              onDragEnd={(event) => {
                setActiveId(null)
                if (event.canceled) return
                if (!isSortableOperation(event.operation)) return
                const { source, target } = event.operation
                if (!source || !target) return
                setPlan((prev) => ({
                  items: arrayMove(prev.items, source.initialIndex, target.index),
                }))
              }}
            >
              <div className="space-y-2">
                {plan.items.map((item, index) => (
                  <SortableItem key={item.id} id={item.id} index={index}>
                    {(handleRef) => {
                      if (item.kind === 'scene') {
                        return (
                          <SceneCard
                            item={item}
                            onDelete={() => deleteItem(item.id)}
                            handleRef={handleRef}
                          />
                        )
                      }
                      if (item.kind === 'encounter') {
                        return (
                          <EncounterCard
                            item={item}
                            onDelete={() => deleteItem(item.id)}
                            handleRef={handleRef}
                          />
                        )
                      }
                      if (item.kind === 'reward') {
                        return (
                          <RewardCard
                            item={item}
                            onDelete={() => deleteItem(item.id)}
                            handleRef={handleRef}
                          />
                        )
                      }
                      if (item.kind === 'hook') {
                        return (
                          <HookCard
                            item={item}
                            onDelete={() => deleteItem(item.id)}
                            handleRef={handleRef}
                          />
                        )
                      }
                      return (
                        <SecretCard
                          item={item}
                          onDelete={() => deleteItem(item.id)}
                          handleRef={handleRef}
                        />
                      )
                    }}
                  </SortableItem>
                ))}

                {plan.items.length === 0 && !addingKind && (
                  <div className="rounded-lg border border-dashed py-12 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      No plan items yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Add encounters, scenes, secrets, rewards, and hooks above.
                    </p>
                  </div>
                )}

                {/* Inline add forms */}
                {addingKind === 'scene' && (
                  <AddSceneForm
                    onAdd={addItem}
                    onCancel={() => setAddingKind(null)}
                  />
                )}
                {addingKind === 'encounter' && (
                  <AddEncounterForm
                    campaignId={campaignId}
                    onAdd={addItem}
                    onCancel={() => setAddingKind(null)}
                  />
                )}
                {addingKind === 'secret' && (
                  <AddSecretForm
                    onAdd={addItem}
                    onCancel={() => setAddingKind(null)}
                  />
                )}
                {addingKind === 'reward' && (
                  <AddRewardForm
                    onAdd={addItem}
                    onCancel={() => setAddingKind(null)}
                  />
                )}
                {addingKind === 'hook' && (
                  <AddHookForm
                    onAdd={addItem}
                    onCancel={() => setAddingKind(null)}
                  />
                )}
              </div>

              <DragOverlay>
                {activeItem?.kind === 'scene' && (
                  <SceneCard item={activeItem} />
                )}
                {activeItem?.kind === 'encounter' && (
                  <EncounterCard item={activeItem} />
                )}
                {activeItem?.kind === 'secret' && (
                  <SecretCard item={activeItem} />
                )}
                {activeItem?.kind === 'reward' && (
                  <RewardCard item={activeItem} />
                )}
                {activeItem?.kind === 'hook' && (
                  <HookCard item={activeItem} />
                )}
              </DragOverlay>
            </DragDropProvider>
          </div>

          {/* Right column: NPC roster + Party */}
          <div className="space-y-3">
            <CollapsiblePanel
              title="NPC Roster"
              icon={Users}
              badge={npcRoster.linkedNpcs.length}
            >
              <SessionNpcRoster campaignId={campaignId} sessionId={sessionId} />
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Party"
              icon={Users}
              badge={players.length}
            >
              <SessionPartyPanel campaignId={campaignId} sessionId={sessionId} />
            </CollapsiblePanel>
          </div>
        </div>
      )}

      {activeTab === 'dm-screen' && (
        <DmScreenPage campaignId={campaignId} sessionId={sessionId} />
      )}
    </div>
  )
}
