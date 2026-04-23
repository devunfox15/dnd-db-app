import { useCollection } from '@/features/core/store'
import { useCampaignStorageState } from '@/features/session-workspace/storage'
import type { SessionPlayersState } from '@/features/session-workspace/session-types'

export default function SessionPartyPanel({
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

  function getOverride(playerId: string) {
    return playersState.overrides.find((o) => o.playerId === playerId)
  }

  function updateNotes(playerId: string, sessionNotes: string) {
    setPlayersState((prev) => {
      const exists = prev.overrides.some((o) => o.playerId === playerId)
      if (exists) {
        return {
          overrides: prev.overrides.map((o) =>
            o.playerId === playerId ? { ...o, sessionNotes } : o,
          ),
        }
      }
      const pc = players.find((p) => p.id === playerId)
      return {
        overrides: [
          ...prev.overrides,
          {
            playerId,
            currentHp: pc?.currentHp ?? 0,
            tempHp: pc?.tempHp ?? 0,
            conditions: pc?.conditions ?? [],
            concentration: pc?.concentration ?? false,
            deathSaves: { successes: 0, failures: 0 },
            sessionNotes,
          },
        ],
      }
    })
  }

  if (players.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
        No player characters in this campaign yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {players.map((pc) => {
        const ov = getOverride(pc.id)
        const currentHp = ov?.currentHp ?? pc.currentHp
        const maxHp = pc.maxHp
        const conditions = ov?.conditions ?? pc.conditions ?? []
        const hpPercent = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0
        const hpColor =
          hpPercent > 50
            ? 'bg-green-500'
            : hpPercent > 25
              ? 'bg-yellow-500'
              : 'bg-red-500'

        return (
          <div
            key={pc.id}
            className="rounded-lg border bg-card shadow-sm"
          >
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{pc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pc.classSummary} · Level {pc.level}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    HP
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {currentHp}/{maxHp}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    AC
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {pc.armorClass}
                  </p>
                </div>
              </div>
            </div>

            {/* HP bar */}
            <div className="mx-3 mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${hpColor}`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {/* Conditions */}
            {conditions.length > 0 && (
              <div className="flex flex-wrap gap-1 px-3 pb-2">
                {conditions.map((c) => (
                  <span
                    key={c}
                    className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-400"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Session notes */}
            <div className="border-t px-3 pb-2 pt-1.5">
              <textarea
                value={ov?.sessionNotes ?? ''}
                onChange={(e) => updateNotes(pc.id, e.target.value)}
                placeholder="Session notes for this player…"
                rows={2}
                className="w-full resize-none rounded-md border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
