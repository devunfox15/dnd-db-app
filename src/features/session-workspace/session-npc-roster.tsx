import { useState } from 'react'
import { Search, Plus, Trash2, Swords } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCollection } from '@/features/core/store'
import { useCampaignStorageState } from '@/features/session-workspace/storage'
import type { SessionNpcRosterState, SessionCombatState } from '@/features/session-workspace/session-types'

export default function SessionNpcRoster({
  campaignId,
  sessionId,
}: {
  campaignId: string
  sessionId: string
}) {
  const npcs = useCollection('npcs', { campaignId })
  const [roster, setRoster] = useCampaignStorageState<SessionNpcRosterState>(
    campaignId,
    `session-npcs-${sessionId}`,
    { linkedNpcs: [] },
  )
  const [combat, setCombat] = useCampaignStorageState<SessionCombatState>(
    campaignId,
    `session-combat-${sessionId}`,
    { isRunning: false, round: 1, turn: 0, combatants: [] },
  )
  const [search, setSearch] = useState('')

  const linkedIds = new Set(roster.linkedNpcs.map((l) => l.npcId))

  const filteredNpcs = npcs.filter((npc) => {
    if (linkedIds.has(npc.id)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      npc.name.toLowerCase().includes(q) ||
      npc.role.toLowerCase().includes(q) ||
      npc.faction.toLowerCase().includes(q)
    )
  })

  function addNpc(npcId: string) {
    setRoster((prev) => ({
      linkedNpcs: [
        ...prev.linkedNpcs,
        { npcId, sessionNotes: '', addedAt: new Date().toISOString() },
      ],
    }))
  }

  function removeNpc(npcId: string) {
    setRoster((prev) => ({
      linkedNpcs: prev.linkedNpcs.filter((l) => l.npcId !== npcId),
    }))
  }

  function updateNotes(npcId: string, notes: string) {
    setRoster((prev) => ({
      linkedNpcs: prev.linkedNpcs.map((l) =>
        l.npcId === npcId ? { ...l, sessionNotes: notes } : l,
      ),
    }))
  }

  function pushToCombat(npcId: string) {
    const npc = npcs.find((n) => n.id === npcId)
    if (!npc) return
    const alreadyIn = combat.combatants.some((c) => c.sourceId === npcId && c.kind === 'npc')
    if (alreadyIn) return
    setCombat((prev) => ({
      ...prev,
      combatants: [
        ...prev.combatants,
        {
          id: crypto.randomUUID(),
          kind: 'npc',
          sourceId: npcId,
          displayName: npc.name,
          initiative: 0,
          initiativeRoll: 0,
          currentHp: 10,
          maxHp: 10,
          tempHp: 0,
          armorClass: 10,
          conditions: [],
          concentration: false,
          isActive: false,
          notes: npc.notes ?? '',
        },
      ],
    }))
  }

  const linkedNpcs = roster.linkedNpcs.map((link) => ({
    link,
    npc: npcs.find((n) => n.id === link.npcId),
  }))

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search NPCs by name, role, faction…"
          className="pl-8"
        />
      </div>

      {/* Search results */}
      {search.trim() && (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {filteredNpcs.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">No NPCs found.</p>
          ) : (
            filteredNpcs.slice(0, 20).map((npc) => (
              <div
                key={npc.id}
                className="flex items-center justify-between px-3 py-2 hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">{npc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[npc.role, npc.faction].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0 text-purple-500 hover:text-purple-600"
                  onClick={() => {
                    addNpc(npc.id)
                    setSearch('')
                  }}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Linked NPCs */}
      {linkedNpcs.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          No NPCs linked to this session yet. Search above to add.
        </p>
      ) : (
        <div className="space-y-2">
          {linkedNpcs.map(({ link, npc }) => {
            if (!npc) return null
            const inCombat = combat.combatants.some(
              (c) => c.sourceId === link.npcId && c.kind === 'npc',
            )
            return (
              <div
                key={link.npcId}
                className="rounded-lg border border-purple-500/30 bg-card shadow-sm"
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{npc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[npc.role, npc.faction].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`size-7 ${inCombat ? 'text-orange-400' : 'text-muted-foreground hover:text-orange-500'}`}
                      onClick={() => pushToCombat(link.npcId)}
                      title={inCombat ? 'Already in combat' : 'Push to combat tracker'}
                    >
                      <Swords className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeNpc(link.npcId)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="border-t px-3 pb-2 pt-1.5">
                  <Textarea
                    value={link.sessionNotes}
                    onChange={(e) => updateNotes(link.npcId, e.target.value)}
                    placeholder="Session notes for this NPC…"
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
