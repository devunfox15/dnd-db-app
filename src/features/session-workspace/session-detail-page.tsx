import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortableOperation } from '@dnd-kit/react/sortable'
import { useSortable } from '@dnd-kit/react/sortable'
import {
  ArrowLeft,
  ChevronDown,
  EyeOff,
  Gift,
  GripVertical,
  Link2,
  Monitor,
  Plus,
  ScrollText,
  Swords,
  Trash2,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCollection } from '@/features/core/store'
import { CollapsiblePanel } from '@/features/session-workspace/collapsible-panel'
import DmScreenPage from '@/features/session-workspace/dm-screen-page'
import MonsterPicker from '@/features/session-workspace/monster-picker'
import SessionNpcRoster from '@/features/session-workspace/session-npc-roster'
import SessionPartyPanel from '@/features/session-workspace/session-party-panel'
import { useCampaignStorageState } from '@/features/session-workspace/storage'
import type {
  EncounterBlock,
  HookBlock,
  RewardBlock,
  SceneBlock,
  SecretBlock,
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

const DND_SKILLS = [
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival',
]

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  result.splice(to, 0, result.splice(from, 1)[0])
  return result
}

// ─── Card Components ──────────────────────────────────────────────────────────

function SceneCard({
  item,
  onDelete,
  handleRef,
}: {
  item: SceneBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-indigo-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">
              Scene
            </span>
            <p className="line-clamp-3 text-sm leading-snug">{item.text}</p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function EncounterCard({
  item,
  onDelete,
  handleRef,
}: {
  item: EncounterBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-red-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500">
              Encounter
            </span>
            <p className="font-medium leading-snug">
              {item.count > 1 && (
                <span className="mr-1.5 inline-flex items-center rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  ×{item.count}
                </span>
              )}
              {item.monsterName}
            </p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        {item.notes && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function SecretCard({
  item,
  onDelete,
  handleRef,
}: {
  item: SecretBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-amber-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
              Secret
            </span>
            <p className="font-medium leading-snug">{item.title}</p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        <div className="mt-1">
          <span className="inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            {item.skill} DC {item.dc}
          </span>
        </div>
        {item.content && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.content}
          </p>
        )}
      </div>
    </div>
  )
}

function RewardCard({
  item,
  onDelete,
  handleRef,
}: {
  item: RewardBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-yellow-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
              Reward
            </span>
            <p className="font-medium leading-snug">{item.title}</p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {item.xp > 0 && (
            <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              {item.xp} XP
            </span>
          )}
          {item.loot && (
            <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              {item.loot}
            </span>
          )}
        </div>
        {item.notes && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function HookCard({
  item,
  onDelete,
  handleRef,
}: {
  item: HookBlock
  onDelete?: () => void
  handleRef?: (el: Element | null) => void
}) {
  return (
    <div className="flex items-stretch rounded-lg border bg-card shadow-sm">
      <div
        ref={handleRef}
        className="flex cursor-grab items-center px-2 text-muted-foreground/30 hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="w-0.5 shrink-0 bg-green-500" />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-green-600 dark:text-green-400">
              Hook
            </span>
            <p className="font-medium leading-snug">{item.title}</p>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Sortable Item Wrapper ────────────────────────────────────────────────────

function SortableItem({
  id,
  index,
  children,
}: {
  id: string
  index: number
  children: (handleRef: (el: Element | null) => void) => React.ReactNode
}) {
  const { ref, handleRef, isDragging } = useSortable({ id, index })

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.4 : 1 }}>
      {children(handleRef)}
    </div>
  )
}

// ─── Inline Add Forms ─────────────────────────────────────────────────────────

function AddSceneForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: SceneBlock) => void
  onCancel: () => void
}) {
  const [textField, setTextField] = useState('')

  function handleSubmit() {
    if (!textField.trim()) return
    onAdd({
      kind: 'scene',
      id: crypto.randomUUID(),
      text: textField.trim(),
    })
  }

  return (
    <div className="rounded-lg border border-indigo-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <ScrollText className="size-3.5 text-indigo-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">
          New Scene
        </span>
      </div>
      <div className="space-y-2 p-3">
        <Textarea
          value={textField}
          onChange={(e) => setTextField(e.target.value)}
          placeholder="Describe the scene, setting, NPCs, and important details for players to know."
          rows={10}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!textField.trim()}>
          Add Scene
        </Button>
      </div>
    </div>
  )
}

function AddEncounterForm({
  campaignId,
  onAdd,
  onCancel,
}: {
  campaignId: string
  onAdd: (item: EncounterBlock) => void
  onCancel: () => void
}) {
  const [pickedName, setPickedName] = useState('')
  const [customName, setCustomName] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [count, setCount] = useState(1)
  const [notes, setNotes] = useState('')

  const resolvedName = pickedName || customName.trim()

  function handleSubmit() {
    if (!resolvedName) return
    onAdd({
      kind: 'encounter',
      id: crypto.randomUUID(),
      monsterName: resolvedName,
      notes: notes.trim(),
      count: Math.max(1, count),
    })
  }

  return (
    <div className="rounded-lg border border-red-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Swords className="size-3.5 text-red-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500">
          New Encounter
        </span>
      </div>
      <div className="space-y-2 p-3">
        {/* Selected monster display */}
        {pickedName ? (
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
            <p className="text-sm font-medium">{pickedName}</p>
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-muted-foreground"
              onClick={() => {
                setPickedName('')
                setShowPicker(false)
              }}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ) : (
          <>
            {showPicker ? (
              <div className="rounded-md border p-2">
                <MonsterPicker
                  campaignId={campaignId}
                  onSelect={(m) => {
                    setPickedName(m.name)
                    setCustomName('')
                    setShowPicker(false)
                  }}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPicker(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Custom enemy name…"
                  autoFocus
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() => setShowPicker(true)}
                >
                  <Swords className="size-3.5" />
                  Pick
                </Button>
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Count
          </label>
          <Input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-20"
          />
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tactics, conditions, triggers… (optional)"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!resolvedName}>
          Add Encounter
        </Button>
      </div>
    </div>
  )
}

function AddSecretForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: SecretBlock) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dc, setDc] = useState(10)
  const [skill, setSkill] = useState('Perception')

  function handleSubmit() {
    if (!title.trim()) return
    onAdd({
      kind: 'secret',
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      dc: Math.max(1, dc),
      skill,
    })
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <EyeOff className="size-3.5 text-amber-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
          New Secret
        </span>
      </div>
      <div className="space-y-2 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Secret title…"
          autoFocus
        />
        <div className="flex gap-2">
          <select
            value={skill}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSkill(e.target.value)
            }
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {DND_SKILLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              DC
            </label>
            <Input
              type="number"
              min={1}
              value={dc}
              onChange={(e) => setDc(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What players learn on a successful roll… (optional)"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          Add Secret
        </Button>
      </div>
    </div>
  )
}

function AddRewardForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: RewardBlock) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [xp, setXp] = useState(0)
  const [loot, setLoot] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit() {
    if (!title.trim()) return
    onAdd({
      kind: 'reward',
      id: crypto.randomUUID(),
      title: title.trim(),
      xp: Math.max(0, xp),
      loot: loot.trim(),
      notes: notes.trim(),
    })
  }

  return (
    <div className="rounded-lg border border-yellow-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Gift className="size-3.5 text-yellow-600 dark:text-yellow-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
          New Reward
        </span>
      </div>
      <div className="space-y-2 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Reward title, e.g. Goblin Cave Cleared"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">XP</label>
          <Input
            type="number"
            min={0}
            value={xp}
            onChange={(e) => setXp(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <Input
          value={loot}
          onChange={(e) => setLoot(e.target.value)}
          placeholder="Loot, e.g. 50 gp, Potion of Healing…"
        />
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes about conditions or distribution… (optional)"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          Add Reward
        </Button>
      </div>
    </div>
  )
}

function AddHookForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: HookBlock) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit() {
    if (!title.trim()) return
    onAdd({
      kind: 'hook',
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
    })
  }

  return (
    <div className="rounded-lg border border-green-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Link2 className="size-3.5 text-green-600 dark:text-green-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-green-600 dark:text-green-400">
          New Hook
        </span>
      </div>
      <div className="space-y-2 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Hook title, e.g. The Missing Merchant"
          autoFocus
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Story hook, rumor, or plot thread players may pursue…"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          Add Hook
        </Button>
      </div>
    </div>
  )
}

// ─── Collapsible Panel ────────────────────────────────────────────────────────

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
