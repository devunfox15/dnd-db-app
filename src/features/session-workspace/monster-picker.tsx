import { useMemo, useState } from 'react'
import { Loader2, Search, Sword } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCollection } from '@/features/core/store'
import { useDndDetail, useDndList } from '@/features/rpg-library/dnd-store'

export interface PickedMonster {
  name: string
  index?: string // SRD index for detail fetch
  hp?: number
  ac?: number
}

// ─── SRD monster detail fetcher ──────────────────────────────────────────────
// When user clicks a SRD monster, we fetch its detail to get HP / AC.
// While loading we show a small spinner inline.

function SrdMonsterDetail({
  index,
  onConfirm,
}: {
  index: string
  onConfirm: (m: PickedMonster) => void
}) {
  const { data, loading } = useDndDetail('monsters', index)

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Loading stats…
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        Failed to load stats.
      </div>
    )
  }

  const rawAc = data.armor_class as number | Array<{ value?: number }> | undefined
  const ac = Array.isArray(rawAc)
    ? (rawAc[0]?.value ?? 10)
    : (rawAc ?? 10)
  const hp = (data.hit_points as number | undefined) ?? 1
  const cr = (data.challenge_rating as number | string | undefined) ?? '?'
  const type = [data.size as string | undefined, data.type as string | undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{data.name as string}</p>
          <p className="text-xs text-muted-foreground">{type} · CR {cr}</p>
        </div>
        <div className="flex shrink-0 gap-3 text-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">HP</p>
            <p className="text-sm font-bold">{hp}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">AC</p>
            <p className="text-sm font-bold">{ac}</p>
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          size="sm"
          onClick={() =>
            onConfirm({ name: data.name as string, index, hp: Number(hp), ac: Number(ac) })

          }
        >
          Use this monster
        </Button>
      </div>
    </div>
  )
}

// ─── SRD Tab ─────────────────────────────────────────────────────────────────

function SrdTab({ onSelect }: { onSelect: (m: PickedMonster) => void }) {
  const { items, loading } = useDndList('monsters')
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items.slice(0, 30)
    return items.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 30)
  }, [items, search])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        {loading && (
          <Loader2 className="absolute right-2.5 top-2.5 size-3.5 animate-spin text-muted-foreground" />
        )}
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSelectedIndex(null)
          }}
          placeholder="Search SRD monsters…"
          className="pl-8"
          autoFocus
        />
      </div>

      {selectedIndex ? (
        <SrdMonsterDetail
          index={selectedIndex}
          onConfirm={(m) => {
            onSelect(m)
            setSelectedIndex(null)
            setSearch('')
          }}
        />
      ) : (
        <div className="max-h-52 overflow-y-auto rounded-md border">
          {loading && items.length === 0 ? (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading monster list…
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No monsters found.</p>
          ) : (
            filtered.map((monster) => (
              <button
                key={monster.index}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left hover:bg-muted/60"
                onClick={() => setSelectedIndex(monster.index)}
              >
                <Sword className="size-3 shrink-0 text-muted-foreground/50" />
                <span className="text-sm">{monster.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Homebrew Tab ─────────────────────────────────────────────────────────────

function HomebrewTab({
  campaignId,
  onSelect,
}: {
  campaignId: string
  onSelect: (m: PickedMonster) => void
}) {
  const entries = useCollection('lookupEntries', { campaignId })
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries.slice(0, 50)
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    )
  }, [entries, search])

  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
        No homebrew entries in this campaign yet. Add them from the RPG Library.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search homebrew entries…"
          className="pl-8"
          autoFocus
        />
      </div>
      <div className="max-h-52 overflow-y-auto rounded-md border">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No entries found.</p>
        ) : (
          filtered.map((entry) => (
            <button
              key={entry.id}
              className="flex w-full cursor-pointer flex-col px-3 py-2 text-left hover:bg-muted/60"
              onClick={() => onSelect({ name: entry.title })}
            >
              <span className="text-sm font-medium">{entry.title}</span>
              <span className="text-xs text-muted-foreground">
                {entry.category}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main MonsterPicker ───────────────────────────────────────────────────────

export default function MonsterPicker({
  campaignId,
  onSelect,
}: {
  campaignId: string
  onSelect: (monster: PickedMonster) => void
}) {
  const [tab, setTab] = useState<'srd' | 'homebrew'>('srd')

  return (
    <div className="space-y-2">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-md border bg-muted/40 p-0.5 w-fit">
        {(['srd', 'homebrew'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded px-3 py-1 text-xs font-semibold capitalize transition-colors ${
              tab === t
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'srd' ? 'SRD' : 'Homebrew'}
          </button>
        ))}
      </div>

      {tab === 'srd' && <SrdTab onSelect={onSelect} />}
      {tab === 'homebrew' && (
        <HomebrewTab campaignId={campaignId} onSelect={onSelect} />
      )}
    </div>
  )
}
