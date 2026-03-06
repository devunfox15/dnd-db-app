import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  EyeOff,
  Monitor,
  Plus,
  ScrollText,
  Swords,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCollection } from '@/features/core/store'
import DmScreenPage from '@/features/session-workspace/dm-screen-page'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface SceneBlock {
  kind: 'scene'
  id: string
  title: string
  body: string
}

interface EncounterBlock {
  kind: 'encounter'
  id: string
  monsterName: string
  monsterLookupId?: string
  notes: string
  count: number
}

interface SecretBlock {
  kind: 'secret'
  id: string
  title: string
  content: string
  dc: number
  skill: string
}

type SessionPlanItem = SceneBlock | EncounterBlock | SecretBlock

interface SessionPlanState {
  items: SessionPlanItem[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

type ViewTab = 'builder' | 'dm-screen'

const tabs: { id: ViewTab; label: string; icon: LucideIcon }[] = [
  { id: 'builder', label: 'Builder', icon: ScrollText },
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

// ─── Card Components ──────────────────────────────────────────────────────────

function SceneCard({
  item,
  onDelete,
}: {
  item: SceneBlock
  onDelete: () => void
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-l-4 border-l-indigo-500 bg-card p-4">
      <ScrollText className="mt-0.5 size-4 shrink-0 text-indigo-500" />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-start justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
            Scene
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        <p className="font-medium leading-snug">{item.title}</p>
        {item.body && (
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
            {item.body}
          </p>
        )}
      </div>
    </div>
  )
}

function EncounterCard({
  item,
  onDelete,
}: {
  item: EncounterBlock
  onDelete: () => void
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-l-4 border-l-red-500 bg-card p-4">
      <Swords className="mt-0.5 size-4 shrink-0 text-red-500" />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-start justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
            Encounter
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        <p className="font-medium leading-snug">
          {item.count > 1 ? `${item.count}× ` : ''}
          {item.monsterName}
        </p>
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
}: {
  item: SecretBlock
  onDelete: () => void
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-l-4 border-l-amber-500 bg-card p-4">
      <EyeOff className="mt-0.5 size-4 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-start justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
            Secret
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        <p className="font-medium leading-snug">{item.title}</p>
        <span className="mt-1 inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          {item.skill} DC {item.dc}
        </span>
        {item.content && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {item.content}
          </p>
        )}
      </div>
    </div>
  )
}

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

  const lookupEntries = useCollection('lookupEntries', { campaignId })

  const [activeTab, setActiveTab] = useState<ViewTab>('builder')

  // Dialog open states
  const [sceneOpen, setSceneOpen] = useState(false)
  const [encounterOpen, setEncounterOpen] = useState(false)
  const [secretOpen, setSecretOpen] = useState(false)

  // Scene form
  const [sceneTitle, setSceneTitle] = useState('')
  const [sceneBody, setSceneBody] = useState('')

  // Encounter form
  const [encounterSearch, setEncounterSearch] = useState('')
  const [encounterCustomName, setEncounterCustomName] = useState('')
  const [encounterLookupId, setEncounterLookupId] = useState<string | null>(null)
  const [encounterCount, setEncounterCount] = useState(1)
  const [encounterNotes, setEncounterNotes] = useState('')

  // Secret form
  const [secretTitle, setSecretTitle] = useState('')
  const [secretContent, setSecretContent] = useState('')
  const [secretDc, setSecretDc] = useState(10)
  const [secretSkill, setSecretSkill] = useState('Perception')

  const session = useMemo(
    () => sessionsState.sessions.find((s) => s.id === sessionId) ?? null,
    [sessionsState.sessions, sessionId],
  )

  const filteredLookupEntries = useMemo(() => {
    const q = encounterSearch.trim().toLowerCase()
    if (!q) return lookupEntries.slice(0, 20)
    return lookupEntries
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      )
      .slice(0, 20)
  }, [lookupEntries, encounterSearch])

  function addItem(item: SessionPlanItem) {
    setPlan((prev) => ({ items: [...prev.items, item] }))
  }

  function deleteItem(id: string) {
    setPlan((prev) => ({ items: prev.items.filter((i) => i.id !== id) }))
  }

  function handleAddScene() {
    if (!sceneTitle.trim()) return
    addItem({
      kind: 'scene',
      id: crypto.randomUUID(),
      title: sceneTitle.trim(),
      body: sceneBody.trim(),
    })
    setSceneTitle('')
    setSceneBody('')
    setSceneOpen(false)
  }

  function handleAddEncounter() {
    const name = encounterLookupId
      ? (lookupEntries.find((e) => e.id === encounterLookupId)?.title ?? encounterCustomName.trim())
      : encounterCustomName.trim()
    if (!name) return
    addItem({
      kind: 'encounter',
      id: crypto.randomUUID(),
      monsterName: name,
      monsterLookupId: encounterLookupId ?? undefined,
      notes: encounterNotes.trim(),
      count: Math.max(1, encounterCount),
    })
    setEncounterSearch('')
    setEncounterCustomName('')
    setEncounterLookupId(null)
    setEncounterCount(1)
    setEncounterNotes('')
    setEncounterOpen(false)
  }

  function handleAddSecret() {
    if (!secretTitle.trim()) return
    addItem({
      kind: 'secret',
      id: crypto.randomUUID(),
      title: secretTitle.trim(),
      content: secretContent.trim(),
      dc: Math.max(1, secretDc),
      skill: secretSkill,
    })
    setSecretTitle('')
    setSecretContent('')
    setSecretDc(10)
    setSecretSkill('Perception')
    setSecretOpen(false)
  }

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

  const selectedLookupEntry = encounterLookupId
    ? lookupEntries.find((e) => e.id === encounterLookupId)
    : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Link
          to="/campaigns/$campaignId/workspace/sessions"
          params={{ campaignId }}
        >
          <Button variant="ghost" size="sm" className="-ml-2 mb-1 gap-1.5">
            <ArrowLeft className="size-4" />
            Sessions
          </Button>
        </Link>
        <h1 className="text-xl font-semibold leading-snug">{session.title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Session #{session.sessionNumber} &middot;{' '}
          {new Date(session.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-3 pb-2 text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Builder tab */}
      {activeTab === 'builder' && (
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setEncounterOpen(true)}
            >
              <Swords className="size-3.5" />
              Encounter
              <Plus className="size-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setSceneOpen(true)}
            >
              <ScrollText className="size-3.5" />
              Scene
              <Plus className="size-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setSecretOpen(true)}
            >
              <EyeOff className="size-3.5" />
              Secret
              <Plus className="size-3" />
            </Button>
          </div>

          {/* Plan item list */}
          {plan.items.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No plan items yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Add encounters, scenes, and secrets above to build your session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.items.map((item) => {
                if (item.kind === 'scene') {
                  return (
                    <SceneCard
                      key={item.id}
                      item={item}
                      onDelete={() => deleteItem(item.id)}
                    />
                  )
                }
                if (item.kind === 'encounter') {
                  return (
                    <EncounterCard
                      key={item.id}
                      item={item}
                      onDelete={() => deleteItem(item.id)}
                    />
                  )
                }
                return (
                  <SecretCard
                    key={item.id}
                    item={item}
                    onDelete={() => deleteItem(item.id)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'dm-screen' && <DmScreenPage campaignId={campaignId} />}

      {/* Scene Dialog */}
      <Dialog open={sceneOpen} onOpenChange={setSceneOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Scene</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="scene-title">
                Title
              </label>
              <Input
                id="scene-title"
                value={sceneTitle}
                onChange={(e) => setSceneTitle(e.target.value)}
                placeholder="e.g. Opening: The Docks at Night"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddScene()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="scene-body">
                Notes / Direction
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Textarea
                id="scene-body"
                value={sceneBody}
                onChange={(e) => setSceneBody(e.target.value)}
                placeholder="Describe what happens, where the party is, what the goal of this scene is..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSceneOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddScene} disabled={!sceneTitle.trim()}>
              Add Scene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encounter Dialog */}
      <Dialog open={encounterOpen} onOpenChange={setEncounterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Encounter</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {/* Monster selector */}
            {lookupEntries.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Monster / Enemy
                </label>
                <Input
                  value={encounterSearch}
                  onChange={(e) => {
                    setEncounterSearch(e.target.value)
                    setEncounterLookupId(null)
                  }}
                  placeholder="Search lookup entries..."
                />
                {selectedLookupEntry ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{selectedLookupEntry.title}</p>
                      <p className="text-xs text-muted-foreground">{selectedLookupEntry.category}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 text-muted-foreground"
                      onClick={() => {
                        setEncounterLookupId(null)
                        setEncounterSearch('')
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ) : encounterSearch.trim() ? (
                  <div className="max-h-40 overflow-y-auto rounded-md border">
                    {filteredLookupEntries.length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground">
                        No entries found. Use custom name below.
                      </p>
                    ) : (
                      filteredLookupEntries.map((entry) => (
                        <button
                          key={entry.id}
                          className="w-full cursor-pointer px-3 py-2 text-left hover:bg-muted/60"
                          onClick={() => {
                            setEncounterLookupId(entry.id)
                            setEncounterSearch(entry.title)
                          }}
                        >
                          <p className="text-sm font-medium">{entry.title}</p>
                          <p className="text-xs text-muted-foreground">{entry.category}</p>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Custom name fallback */}
            {!encounterLookupId && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="encounter-custom">
                  {lookupEntries.length > 0 ? 'Or enter custom name' : 'Enemy name'}
                </label>
                <Input
                  id="encounter-custom"
                  value={encounterCustomName}
                  onChange={(e) => setEncounterCustomName(e.target.value)}
                  placeholder="e.g. Goblin, Bandit Captain, Custom Boss"
                />
              </div>
            )}

            {/* Count */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="encounter-count">
                Count
              </label>
              <Input
                id="encounter-count"
                type="number"
                min={1}
                value={encounterCount}
                onChange={(e) => setEncounterCount(Number(e.target.value))}
                className="w-24"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="encounter-notes">
                Notes
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Textarea
                id="encounter-notes"
                value={encounterNotes}
                onChange={(e) => setEncounterNotes(e.target.value)}
                placeholder="Tactics, special conditions, triggers..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEncounterOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddEncounter}
              disabled={!encounterLookupId && !encounterCustomName.trim()}
            >
              Add Encounter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Dialog */}
      <Dialog open={secretOpen} onOpenChange={setSecretOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Secret</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="secret-title">
                Title
              </label>
              <Input
                id="secret-title"
                value={secretTitle}
                onChange={(e) => setSecretTitle(e.target.value)}
                placeholder="e.g. The Spy's True Identity"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium" htmlFor="secret-skill">
                  Skill
                </label>
                <select
                  id="secret-skill"
                  value={secretSkill}
                  onChange={(e) => setSecretSkill(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {DND_SKILLS.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24 space-y-1.5">
                <label className="text-sm font-medium" htmlFor="secret-dc">
                  DC
                </label>
                <Input
                  id="secret-dc"
                  type="number"
                  min={1}
                  value={secretDc}
                  onChange={(e) => setSecretDc(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="secret-content">
                Secret Content
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (revealed on successful roll)
                </span>
              </label>
              <Textarea
                id="secret-content"
                value={secretContent}
                onChange={(e) => setSecretContent(e.target.value)}
                placeholder="What the players learn if they succeed..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSecretOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddSecret} disabled={!secretTitle.trim()}>
              Add Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
