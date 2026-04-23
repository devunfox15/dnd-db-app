import { useState } from 'react'
import { Minus, Plus, Shield, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCollection } from '@/features/core/store'
import { useCampaignStorageState } from '@/features/session-workspace/storage'
import {
  DND_CONDITIONS,
  type SessionCombatState,
  type SessionPlayersState,
} from '@/features/session-workspace/session-types'

function ConditionToggle({
  conditions,
  onChange,
}: {
  conditions: string[]
  onChange: (c: string[]) => void
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
        className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <Shield className="size-3" />
        {conditions.length > 0 ? (
          <span className="font-semibold text-yellow-600 dark:text-yellow-400">
            {conditions.length}
          </span>
        ) : (
          'Conditions'
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-20 max-h-60 w-52 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
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

function SpellSlotTracker({
  slots,
  usedSlots,
  onChangeUsed,
}: {
  slots: Array<{ level: number; total: number }>
  usedSlots: Record<number, number>
  onChangeUsed: (level: number, used: number) => void
}) {
  if (slots.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {slots.map(({ level, total }) => {
        const used = usedSlots[level] ?? 0
        return (
          <div key={level} className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">
              L{level}
            </span>
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                title={i < used ? 'Mark available' : 'Mark used'}
                className={`size-3.5 rounded-sm border transition-colors ${
                  i < used
                    ? 'border-violet-500 bg-violet-500'
                    : 'border-muted-foreground/40 hover:border-violet-400'
                }`}
                onClick={() => onChangeUsed(level, i < used ? i : i + 1)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function SessionDmPartyPanel({
  campaignId,
  sessionId,
}: {
  campaignId: string
  sessionId: string
}) {
  const players = useCollection('playerCharacters', { campaignId })
  const [playersState, setPlayersState] =
    useCampaignStorageState<SessionPlayersState>(
      campaignId,
      `session-players-${sessionId}`,
      { overrides: [] },
    )
  const [combat, setCombat] = useCampaignStorageState<SessionCombatState>(
    campaignId,
    `session-combat-${sessionId}`,
    { isRunning: false, round: 1, turn: 0, combatants: [] },
  )

  function getOverride(playerId: string) {
    return playersState.overrides.find((o) => o.playerId === playerId)
  }

  function ensureOverride(playerId: string) {
    const pc = players.find((p) => p.id === playerId)
    const exists = playersState.overrides.some((o) => o.playerId === playerId)
    if (!exists && pc) {
      setPlayersState((prev) => ({
        overrides: [
          ...prev.overrides,
          {
            playerId,
            currentHp: pc.currentHp,
            tempHp: pc.tempHp,
            conditions: pc.conditions ?? [],
            concentration: pc.concentration ?? false,
            deathSaves: { successes: 0, failures: 0 },
            sessionNotes: '',
          },
        ],
      }))
    }
  }

  function updateOverride(
    playerId: string,
    patch: Partial<{
      currentHp: number
      tempHp: number
      conditions: string[]
      concentration: boolean
    }>,
  ) {
    ensureOverride(playerId)
    setPlayersState((prev) => ({
      overrides: prev.overrides.map((o) =>
        o.playerId === playerId ? { ...o, ...patch } : o,
      ),
    }))
  }

  function changeHp(playerId: string, delta: number, currentHp: number, maxHp: number) {
    const next = Math.max(0, Math.min(maxHp, currentHp + delta))
    updateOverride(playerId, { currentHp: next })
  }

  function updateSpellSlotsUsed(
    playerId: string,
    level: number,
    used: number,
  ) {
    setCombat((prev) => {
      const combatants = prev.combatants.map((c) => {
        if (c.sourceId !== playerId || c.kind !== 'player') return c
        return {
          ...c,
          spellSlotsUsed: { ...(c.spellSlotsUsed ?? {}), [level]: used },
        }
      })
      return { ...prev, combatants }
    })
  }

  if (players.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
        No player characters in this campaign.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {players.map((pc) => {
        const ov = getOverride(pc.id)
        const currentHp = ov?.currentHp ?? pc.currentHp
        const maxHp = pc.maxHp
        const conditions = ov?.conditions ?? pc.conditions ?? []
        const concentration = ov?.concentration ?? pc.concentration ?? false
        const hpPct = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0
        const hpColor =
          hpPct > 50 ? 'bg-green-500' : hpPct > 25 ? 'bg-yellow-500' : 'bg-red-500'

        // Build spell slot summary from sheet
        const spellSlotsByLevel: Record<number, number> = {}
        const spellSlots = (pc.sheet as { spellSlots?: Array<{ level: number; max: number }> })
          ?.spellSlots
        if (Array.isArray(spellSlots)) {
          spellSlots.forEach(({ level, max }) => {
            if (max > 0) spellSlotsByLevel[level] = max
          })
        }
        const slotsArray = Object.entries(spellSlotsByLevel)
          .map(([level, total]) => ({ level: Number(level), total }))
          .sort((a, b) => a.level - b.level)

        const combatantEntry = combat.combatants.find(
          (c) => c.sourceId === pc.id && c.kind === 'player',
        )
        const usedSlots = combatantEntry?.spellSlotsUsed ?? {}

        return (
          <div key={pc.id} className="rounded-lg border bg-card shadow-sm">
            {/* Header row */}
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{pc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pc.classSummary} · Level {pc.level}
                </p>
              </div>
              {/* HP controls */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => changeHp(pc.id, -1, currentHp, maxHp)}
                >
                  <Minus className="size-3" />
                </Button>
                <div className="min-w-13 text-center">
                  <p className="text-sm font-bold tabular-nums">
                    {currentHp}/{maxHp}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => changeHp(pc.id, 1, currentHp, maxHp)}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
              {/* AC */}
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  AC
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {pc.armorClass}
                </p>
              </div>
              {/* Concentration */}
              <Button
                size="icon"
                variant="ghost"
                className={`size-7 ${concentration ? 'text-violet-500' : 'text-muted-foreground/40'}`}
                title="Toggle concentration"
                onClick={() =>
                  updateOverride(pc.id, { concentration: !concentration })
                }
              >
                <Zap className="size-3.5" />
              </Button>
            </div>

            {/* HP bar */}
            <div className="mx-3 mb-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${hpColor}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>

            {/* Conditions + spell slots */}
            <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
              <ConditionToggle
                conditions={conditions}
                onChange={(c) => updateOverride(pc.id, { conditions: c })}
              />
              {conditions.map((c) => (
                <span
                  key={c}
                  className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-400"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Spell slots */}
            {slotsArray.length > 0 && (
              <div className="border-t px-3 pb-2 pt-1.5">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Spell Slots
                </p>
                <SpellSlotTracker
                  slots={slotsArray}
                  usedSlots={usedSlots}
                  onChangeUsed={(level, used) =>
                    updateSpellSlotsUsed(pc.id, level, used)
                  }
                />
              </div>
            )}

            {/* Death saves at 0 HP */}
            {currentHp <= 0 && (
              <div className="flex items-center gap-3 border-t px-3 py-1.5">
                <span className="text-xs font-semibold text-destructive">
                  Death Saves
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-green-600">✓</span>
                  {[0, 1, 2].map((i) => {
                    const successes = ov?.deathSaves?.successes ?? 0
                    return (
                      <button
                        key={i}
                        className={`size-4 rounded-full border transition-colors ${
                          successes > i
                            ? 'border-green-500 bg-green-500'
                            : 'border-muted-foreground/40'
                        }`}
                        onClick={() => {
                          ensureOverride(pc.id)
                          setPlayersState((prev) => ({
                            overrides: prev.overrides.map((o) =>
                              o.playerId === pc.id
                                ? {
                                    ...o,
                                    deathSaves: {
                                      successes:
                                        successes > i ? i : i + 1,
                                      failures: o.deathSaves.failures,
                                    },
                                  }
                                : o,
                            ),
                          }))
                        }}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-destructive">✗</span>
                  {[0, 1, 2].map((i) => {
                    const failures = ov?.deathSaves?.failures ?? 0
                    return (
                      <button
                        key={i}
                        className={`size-4 rounded-full border transition-colors ${
                          failures > i
                            ? 'border-destructive bg-destructive'
                            : 'border-muted-foreground/40'
                        }`}
                        onClick={() => {
                          ensureOverride(pc.id)
                          setPlayersState((prev) => ({
                            overrides: prev.overrides.map((o) =>
                              o.playerId === pc.id
                                ? {
                                    ...o,
                                    deathSaves: {
                                      successes: o.deathSaves.successes,
                                      failures:
                                        failures > i ? i : i + 1,
                                    },
                                  }
                                : o,
                            ),
                          }))
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
