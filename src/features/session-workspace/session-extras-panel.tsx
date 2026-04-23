import { useEffect, useRef, useState } from 'react'
import { Clock, Gift, Plus, Star, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCampaignStorageState } from '@/features/session-workspace/storage'
import type { LootEntry, SessionExtrasState } from '@/features/session-workspace/session-types'

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function SessionExtrasPanel({
  campaignId,
  sessionId,
}: {
  campaignId: string
  sessionId: string
}) {
  const [extras, setExtras] = useCampaignStorageState<SessionExtrasState>(
    campaignId,
    `session-extras-${sessionId}`,
    {
      xpAwarded: 0,
      milestoneNote: '',
      lootLog: [],
      sessionStartedAt: null,
      sessionEndedAt: null,
      totalPausedMs: 0,
    },
  )

  // Live clock tick
  const [now, setNow] = useState(Date.now())
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (extras.sessionStartedAt && !extras.sessionEndedAt) {
      tickRef.current = setInterval(() => setNow(Date.now()), 1000)
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [extras.sessionStartedAt, extras.sessionEndedAt])

  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const isPaused = pausedAt !== null

  function startSession() {
    setExtras((prev) => ({
      ...prev,
      sessionStartedAt: new Date().toISOString(),
      sessionEndedAt: null,
      totalPausedMs: 0,
    }))
    setPausedAt(null)
    setNow(Date.now())
  }

  function pauseSession() {
    setPausedAt(Date.now())
  }

  function resumeSession() {
    if (pausedAt) {
      const pausedMs = Date.now() - pausedAt
      setExtras((prev) => ({
        ...prev,
        totalPausedMs: prev.totalPausedMs + pausedMs,
      }))
      setPausedAt(null)
    }
  }

  function stopSession() {
    setExtras((prev) => ({ ...prev, sessionEndedAt: new Date().toISOString() }))
    setPausedAt(null)
  }

  function elapsedMs(): number {
    if (!extras.sessionStartedAt) return 0
    const startMs = new Date(extras.sessionStartedAt).getTime()
    const endMs = extras.sessionEndedAt
      ? new Date(extras.sessionEndedAt).getTime()
      : isPaused
        ? pausedAt ?? now
        : now
    return Math.max(0, endMs - startMs - extras.totalPausedMs)
  }

  // Loot log
  const [lootDesc, setLootDesc] = useState('')
  const [lootValue, setLootValue] = useState('')
  const [lootAssignedTo, setLootAssignedTo] = useState('Party')

  function addLoot() {
    if (!lootDesc.trim()) return
    const entry: LootEntry = {
      id: crypto.randomUUID(),
      description: lootDesc.trim(),
      value: lootValue.trim(),
      assignedTo: lootAssignedTo.trim() || 'Party',
      addedAt: new Date().toISOString(),
    }
    setExtras((prev) => ({ ...prev, lootLog: [entry, ...prev.lootLog] }))
    setLootDesc('')
    setLootValue('')
  }

  function removeLoot(id: string) {
    setExtras((prev) => ({
      ...prev,
      lootLog: prev.lootLog.filter((l) => l.id !== id),
    }))
  }

  const isRunning = !!extras.sessionStartedAt && !extras.sessionEndedAt

  return (
    <div className="space-y-4">
      {/* Session Timer */}
      <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <Clock className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">Session Timer</span>
        </div>
        <div className="mb-3 text-3xl font-bold tabular-nums">
          {formatElapsed(elapsedMs())}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isRunning && (
            <Button size="sm" onClick={startSession}>
              {extras.sessionStartedAt && extras.sessionEndedAt
                ? 'Restart'
                : 'Start Session'}
            </Button>
          )}
          {isRunning && !isPaused && (
            <Button size="sm" variant="outline" onClick={pauseSession}>
              Pause
            </Button>
          )}
          {isRunning && isPaused && (
            <Button size="sm" variant="outline" onClick={resumeSession}>
              Resume
            </Button>
          )}
          {isRunning && (
            <Button size="sm" variant="ghost" onClick={stopSession}>
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* XP & Milestone */}
      <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <Star className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">XP & Milestone</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              XP Awarded
            </label>
            <Input
              type="number"
              min={0}
              value={extras.xpAwarded}
              onChange={(e) =>
                setExtras((prev) => ({
                  ...prev,
                  xpAwarded: Math.max(0, Number(e.target.value)),
                }))
              }
              className="w-28"
            />
          </div>
          <Textarea
            value={extras.milestoneNote}
            onChange={(e) =>
              setExtras((prev) => ({ ...prev, milestoneNote: e.target.value }))
            }
            placeholder="Milestone note or level-up trigger…"
            rows={2}
          />
        </div>
      </div>

      {/* Loot Log */}
      <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <Gift className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">Loot Log</span>
        </div>

        {/* Add loot form */}
        <div className="mb-3 space-y-2 rounded-md border border-dashed p-2">
          <Input
            value={lootDesc}
            onChange={(e) => setLootDesc(e.target.value)}
            placeholder="Item or loot description…"
            onKeyDown={(e) => e.key === 'Enter' && addLoot()}
          />
          <div className="flex gap-2">
            <Input
              value={lootValue}
              onChange={(e) => setLootValue(e.target.value)}
              placeholder="Value, e.g. 50 gp…"
            />
            <Input
              value={lootAssignedTo}
              onChange={(e) => setLootAssignedTo(e.target.value)}
              placeholder="Assigned to…"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={addLoot}
              disabled={!lootDesc.trim()}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {extras.lootLog.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            No loot logged yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {extras.lootLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{entry.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.value && (
                      <span className="text-xs text-muted-foreground">
                        {entry.value}
                      </span>
                    )}
                    {entry.assignedTo && (
                      <span className="text-xs text-muted-foreground">
                        → {entry.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeLoot(entry.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
