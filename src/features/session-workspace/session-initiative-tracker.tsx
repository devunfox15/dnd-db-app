import { useState } from 'react'
import {
  ChevronRight,
  Minus,
  Plus,
  RefreshCw,
  Shield,
  SkipForward,
  Swords,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCollection } from '@/features/core/store'
import MonsterPicker from '@/features/session-workspace/monster-picker'
import { useCampaignStorageState } from '@/features/session-workspace/storage'
import {
  DND_CONDITIONS,
  type CombatantEntry,
  type SessionCombatState,
  type SessionNpcRosterState,
} from '@/features/session-workspace/session-types'

// ─── Condition Popover ────────────────────────────────────────────────────────

function ConditionPopover({
  conditions,
  onChange,
}: {
  conditions: string[]
  onChange: (conditions: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  function toggle(c: string) {
    if (conditions.includes(c)) {
      onChange(conditions.filter((x) => x !== c))
    } else {
      onChange([...conditions, c])
    }
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        className="h-6 gap-1 px-1.5 text-xs"
        onClick={() => setOpen((v) => !v)}
      >
        <Shield className="size-3" />
        {conditions.length > 0 ? conditions.length : '+'}
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-7 z-20 max-h-60 w-52 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
            {DND_CONDITIONS.map((c) => (
              <button
                key={c}
                className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted/60 ${conditions.includes(c) ? 'font-semibold text-yellow-600 dark:text-yellow-400' : ''}`}
                onClick={() => toggle(c)}
              >
                <span
                  className={`size-2 rounded-full border ${conditions.includes(c) ? 'border-yellow-500 bg-yellow-500' : 'border-muted-foreground/40'}`}
                />
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── HP Controls ─────────────────────────────────────────────────────────────

function HpControl({
  current,
  max,
  onChange,
}: {
  current: number
  max: number
  onChange: (hp: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const pct = max > 0 ? Math.round((current / max) * 100) : 0
  const barColor =
    pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'

  if (editing) {
    return (
      <Input
        type="number"
        value={draft}
        autoFocus
        className="h-6 w-16 text-xs"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const v = parseInt(draft)
          if (!isNaN(v)) onChange(Math.max(0, Math.min(max, v)))
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const v = parseInt(draft)
            if (!isNaN(v)) onChange(Math.max(0, Math.min(max, v)))
            setEditing(false)
          }
          if (e.key === 'Escape') setEditing(false)
        }}
      />
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="size-6"
        onClick={() => onChange(Math.max(0, current - 1))}
      >
        <Minus className="size-3" />
      </Button>
      <div className="flex min-w-13 flex-col items-center">
        <button
          className="cursor-pointer text-sm font-semibold tabular-nums hover:underline"
          onClick={() => {
            setDraft(String(current))
            setEditing(true)
          }}
        >
          {current}/{max}
        </button>
        <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="size-6"
        onClick={() => onChange(Math.min(max, current + 1))}
      >
        <Plus className="size-3" />
      </Button>
    </div>
  )
}

// ─── Setup Row ────────────────────────────────────────────────────────────────

interface SetupEntry {
  id: string
  kind: 'player' | 'npc' | 'monster'
  sourceId: string
  displayName: string
  hp: number
  maxHp: number
  ac: number
  initiative: number
  dexMod: number
}

function rollD20(mod: number): number {
  return Math.floor(Math.random() * 20) + 1 + mod
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SessionInitiativeTracker({
  campaignId,
  sessionId,
}: {
  campaignId: string
  sessionId: string
}) {
  const players = useCollection('playerCharacters', { campaignId })
  const npcs = useCollection('npcs', { campaignId })
  const [npcRoster] = useCampaignStorageState<SessionNpcRosterState>(
    campaignId,
    `session-npcs-${sessionId}`,
    { linkedNpcs: [] },
  )
  const [combat, setCombat] = useCampaignStorageState<SessionCombatState>(
    campaignId,
    `session-combat-${sessionId}`,
    { isRunning: false, round: 1, turn: 0, combatants: [] },
  )

  const [showSetup, setShowSetup] = useState(false)
  const [setupEntries, setSetupEntries] = useState<SetupEntry[]>([])
  const [monsterName, setMonsterName] = useState('')
  const [monsterHp, setMonsterHp] = useState(10)
  const [monsterAc, setMonsterAc] = useState(10)
  const [showMonsterPicker, setShowMonsterPicker] = useState(false)

  function openSetup() {
    const entries: SetupEntry[] = []

    players.forEach((pc) => {
      const dexMod = pc.abilityScores?.dex
        ? Math.floor((pc.abilityScores.dex - 10) / 2)
        : 0
      entries.push({
        id: pc.id,
        kind: 'player',
        sourceId: pc.id,
        displayName: pc.name,
        hp: pc.currentHp,
        maxHp: pc.maxHp,
        ac: pc.armorClass,
        initiative: 0,
        dexMod,
      })
    })

    npcRoster.linkedNpcs.forEach((link) => {
      const npc = npcs.find((n) => n.id === link.npcId)
      if (!npc) return
      entries.push({
        id: link.npcId,
        kind: 'npc',
        sourceId: link.npcId,
        displayName: npc.name,
        hp: 10,
        maxHp: 10,
        ac: 10,
        initiative: 0,
        dexMod: 0,
      })
    })

    setSetupEntries(entries)
    setShowSetup(true)
  }

  function updateSetup(id: string, patch: Partial<SetupEntry>) {
    setSetupEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    )
  }

  function rollAll() {
    setSetupEntries((prev) =>
      prev.map((e) => ({ ...e, initiative: rollD20(e.dexMod) })),
    )
  }

  function addMonster() {
    if (!monsterName.trim()) return
    const newEntry: SetupEntry = {
      id: crypto.randomUUID(),
      kind: 'monster',
      sourceId: '',
      displayName: monsterName.trim(),
      hp: monsterHp,
      maxHp: monsterHp,
      ac: monsterAc,
      initiative: 0,
      dexMod: 0,
    }
    setSetupEntries((prev) => [...prev, newEntry])
    setMonsterName('')
    setMonsterHp(10)
    setMonsterAc(10)
  }

  function beginCombat() {
    const sorted = [...setupEntries].sort(
      (a, b) => b.initiative - a.initiative,
    )
    const combatants: CombatantEntry[] = sorted.map((e) => ({
      id: crypto.randomUUID(),
      kind: e.kind,
      sourceId: e.sourceId,
      displayName: e.displayName,
      initiative: e.initiative,
      initiativeRoll: e.initiative,
      currentHp: e.hp,
      maxHp: e.maxHp,
      tempHp: 0,
      armorClass: e.ac,
      conditions: [],
      concentration: false,
      isActive: false,
      notes: '',
    }))
    if (combatants.length > 0) combatants[0].isActive = true
    setCombat({ isRunning: true, round: 1, turn: 0, combatants })
    setShowSetup(false)
  }

  function endCombat() {
    setCombat((prev) => ({ ...prev, isRunning: false }))
  }

  function nextTurn() {
    setCombat((prev) => {
      const count = prev.combatants.length
      if (count === 0) return prev
      const nextTurn = prev.turn + 1
      const isNewRound = nextTurn >= count
      const newTurn = nextTurn % count
      return {
        ...prev,
        round: isNewRound ? prev.round + 1 : prev.round,
        turn: newTurn,
        combatants: prev.combatants.map((c, i) => ({
          ...c,
          isActive: i === newTurn,
        })),
      }
    })
  }

  function updateCombatant(id: string, patch: Partial<CombatantEntry>) {
    setCombat((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }))
  }

  function removeCombatant(id: string) {
    setCombat((prev) => {
      const next = prev.combatants.filter((c) => c.id !== id)
      const activeTurn = Math.min(prev.turn, Math.max(0, next.length - 1))
      return {
        ...prev,
        turn: activeTurn,
        combatants: next.map((c, i) => ({ ...c, isActive: i === activeTurn })),
      }
    })
  }

  // ── Setup Drawer ─────────────────────────────────────────────────────────────

  if (showSetup) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Setup Initiative</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={rollAll}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Roll All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSetup(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={beginCombat}
              disabled={setupEntries.length === 0}
            >
              Begin Combat
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {setupEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
            >
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  entry.kind === 'player'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : entry.kind === 'npc'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {entry.kind}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {entry.displayName}
              </span>
              {entry.kind !== 'player' && (
                <>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">HP</label>
                    <Input
                      type="number"
                      min={1}
                      value={entry.hp}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        updateSetup(entry.id, { hp: v, maxHp: v })
                      }}
                      className="h-7 w-16 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">AC</label>
                    <Input
                      type="number"
                      min={1}
                      value={entry.ac}
                      onChange={(e) =>
                        updateSetup(entry.id, { ac: Number(e.target.value) })
                      }
                      className="h-7 w-16 text-xs"
                    />
                  </div>
                </>
              )}
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground">Init</label>
                <Input
                  type="number"
                  value={entry.initiative}
                  onChange={(e) =>
                    updateSetup(entry.id, {
                      initiative: Number(e.target.value),
                    })
                  }
                  className="h-7 w-16 text-xs"
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() =>
                  updateSetup(entry.id, {
                    initiative: rollD20(entry.dexMod),
                  })
                }
                title="Roll initiative"
              >
                <RefreshCw className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() =>
                  setSetupEntries((prev) =>
                    prev.filter((e) => e.id !== entry.id),
                  )
                }
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add monster */}
        <div className="rounded-lg border border-dashed p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Add Monster
          </p>
          {showMonsterPicker ? (
            <div className="space-y-2">
              <MonsterPicker
                campaignId={campaignId}
                onSelect={(m) => {
                  setMonsterName(m.name)
                  if (m.hp) setMonsterHp(m.hp)
                  if (m.ac) setMonsterAc(m.ac)
                  setShowMonsterPicker(false)
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMonsterPicker(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={monsterName}
                onChange={(e) => setMonsterName(e.target.value)}
                placeholder="Monster name…"
                className="h-7 flex-1 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addMonster()}
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setShowMonsterPicker(true)}
              >
                <Swords className="size-3.5" />
                Pick
              </Button>
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground">HP</label>
                <Input
                  type="number"
                  min={1}
                  value={monsterHp}
                  onChange={(e) => setMonsterHp(Number(e.target.value))}
                  className="h-7 w-16 text-xs"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground">AC</label>
                <Input
                  type="number"
                  min={1}
                  value={monsterAc}
                  onChange={(e) => setMonsterAc(Number(e.target.value))}
                  className="h-7 w-16 text-xs"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addMonster}
                disabled={!monsterName.trim()}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Not running ──────────────────────────────────────────────────────────────

  if (!combat.isRunning) {
    return (
      <div className="space-y-4">
        {combat.combatants.length > 0 && (
          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Last combat ended — {combat.combatants.length} combatants.
            </p>
          </div>
        )}
        <Button className="gap-2" onClick={openSetup}>
          <Swords className="size-4" />
          Start Combat
        </Button>
      </div>
    )
  }

  // ── Live Tracker ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Round
          </span>
          <span className="text-lg font-bold tabular-nums">{combat.round}</span>
        </div>
        <Button size="sm" className="gap-1.5" onClick={nextTurn}>
          <SkipForward className="size-3.5" />
          Next Turn
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto gap-1.5 text-muted-foreground"
          onClick={endCombat}
        >
          End Combat
        </Button>
      </div>

      {/* Combatant list */}
      <div className="space-y-2">
        {combat.combatants.map((c) => {
          const isAtZero = c.currentHp <= 0
          return (
            <div
              key={c.id}
              className={`rounded-lg border bg-card shadow-sm transition-all ${
                c.isActive ? 'border-orange-400 ring-1 ring-orange-400/40' : ''
              }`}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                {c.isActive && (
                  <ChevronRight className="size-4 shrink-0 text-orange-400" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase ${
                        c.kind === 'player'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : c.kind === 'npc'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {c.kind}
                    </span>
                    <p className="truncate text-sm font-medium">
                      {c.displayName}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      Init {c.initiative}
                    </span>
                  </div>

                  {/* Conditions */}
                  {c.conditions.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {c.conditions.map((cond) => (
                        <span
                          key={cond}
                          className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-400"
                        >
                          {cond}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex shrink-0 items-center gap-2">
                  <HpControl
                    current={c.currentHp}
                    max={c.maxHp}
                    onChange={(hp) => updateCombatant(c.id, { currentHp: hp })}
                  />
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      AC
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {c.armorClass}
                    </p>
                  </div>
                  <ConditionPopover
                    conditions={c.conditions}
                    onChange={(conditions) =>
                      updateCombatant(c.id, { conditions })
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCombatant(c.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Death saves for players at 0 HP */}
              {c.kind === 'player' && isAtZero && (
                <div className="flex items-center gap-3 border-t px-3 py-1.5">
                  <span className="text-xs font-semibold text-destructive">
                    Death Saves
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-green-600">✓</span>
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        className={`size-4 rounded-full border transition-colors ${
                          (c.deathSaves?.successes ?? 0) > i
                            ? 'border-green-500 bg-green-500'
                            : 'border-muted-foreground/40'
                        }`}
                        onClick={() => {
                          const cur = c.deathSaves?.successes ?? 0
                          updateCombatant(c.id, {
                            deathSaves: {
                              successes: cur > i ? i : i + 1,
                              failures: c.deathSaves?.failures ?? 0,
                            },
                          })
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-destructive">✗</span>
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        className={`size-4 rounded-full border transition-colors ${
                          (c.deathSaves?.failures ?? 0) > i
                            ? 'border-destructive bg-destructive'
                            : 'border-muted-foreground/40'
                        }`}
                        onClick={() => {
                          const cur = c.deathSaves?.failures ?? 0
                          updateCombatant(c.id, {
                            deathSaves: {
                              successes: c.deathSaves?.successes ?? 0,
                              failures: cur > i ? i : i + 1,
                            },
                          })
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {combat.combatants.length === 0 && (
          <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            No combatants. End combat and start a new one.
          </p>
        )}
      </div>
    </div>
  )
}
