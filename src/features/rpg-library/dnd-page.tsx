import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useDndClassSpells,
  useDndDetail,
  useDndList,
} from './dnd-store'
import type { DndListItem } from './dnd-store'

// Local aliases for brevity within this file
type ApiItem = DndListItem
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DetailData = Record<string, any>

type TabConfig = {
  key: string
  label: string
  endpoint: string
}

const DND_TABS: TabConfig[] = [
  { key: 'spells', label: 'Spells', endpoint: 'spells' },
  { key: 'monsters', label: 'Monsters', endpoint: 'monsters' },
  { key: 'classes', label: 'Classes', endpoint: 'classes' },
  { key: 'equipment', label: 'Equipment', endpoint: 'equipment' },
  { key: 'magic-items', label: 'Magic Items', endpoint: 'magic-items' },
  { key: 'races', label: 'Races', endpoint: 'races' },
  { key: 'conditions', label: 'Conditions', endpoint: 'conditions' },
  { key: 'skills', label: 'Skills', endpoint: 'skills' },
]

const DND_CLASSES = [
  { index: 'bard', name: 'Bard' },
  { index: 'cleric', name: 'Cleric' },
  { index: 'druid', name: 'Druid' },
  { index: 'paladin', name: 'Paladin' },
  { index: 'ranger', name: 'Ranger' },
  { index: 'sorcerer', name: 'Sorcerer' },
  { index: 'warlock', name: 'Warlock' },
  { index: 'wizard', name: 'Wizard' },
]

// ---------------------------------------------------------------------------
// Shared detail UI utilities
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-xs leading-relaxed">{value}</span>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="border-b pb-1 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function DescBlock({ lines }: { lines: string[] }) {
  if (!lines?.length) return null
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} className="text-xs leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  )
}

function AbilityGrid({ data }: { data: DetailData }) {
  const scores = [
    ['STR', data.strength],
    ['DEX', data.dexterity],
    ['CON', data.constitution],
    ['INT', data.intelligence],
    ['WIS', data.wisdom],
    ['CHA', data.charisma],
  ] as [string, number][]

  return (
    <div className="grid grid-cols-6 gap-1 text-center">
      {scores.map(([label, val]) => {
        const mod = Math.floor((Number(val) - 10) / 2)
        const modStr = mod >= 0 ? `+${mod}` : String(mod)
        return (
          <div key={label} className="rounded border p-1.5">
            <div className="text-[10px] text-muted-foreground">{label}</div>
            <div className="text-sm font-bold">{val}</div>
            <div className="text-[10px] text-muted-foreground">{modStr}</div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Per-entity detail views
// ---------------------------------------------------------------------------

function SpellDetail({ data }: { data: DetailData }) {
  const components = (data.components as string[]) ?? []
  const hasMaterial = components.includes('M') && data.material

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">
          {data.level === 0 ? 'Cantrip' : `Level ${data.level}`}
        </Badge>
        {data.school?.name && <Badge variant="outline">{data.school.name}</Badge>}
        {data.concentration && <Badge variant="destructive">Concentration</Badge>}
        {data.ritual && <Badge variant="outline">Ritual</Badge>}
      </div>

      <DetailSection title="Casting">
        <DetailRow label="Casting Time" value={data.casting_time} />
        <DetailRow label="Range" value={data.range} />
        <DetailRow label="Duration" value={data.duration} />
        <DetailRow
          label="Components"
          value={
            <span>
              {components.join(', ')}
              {hasMaterial && (
                <span className="ml-1 text-muted-foreground">({data.material})</span>
              )}
            </span>
          }
        />
        {data.area_of_effect && (
          <DetailRow
            label="Area of Effect"
            value={`${data.area_of_effect.size} ft. ${data.area_of_effect.type}`}
          />
        )}
        {data.dc && (
          <DetailRow
            label="Save"
            value={`${data.dc.dc_type?.name} DC (on success: ${data.dc.dc_success})`}
          />
        )}
        {data.damage?.damage_type && (
          <DetailRow label="Damage Type" value={data.damage.damage_type.name} />
        )}
      </DetailSection>

      {data.desc?.length > 0 && (
        <DetailSection title="Description">
          <DescBlock lines={data.desc} />
        </DetailSection>
      )}

      {data.higher_level?.length > 0 && (
        <DetailSection title="At Higher Levels">
          <DescBlock lines={data.higher_level} />
        </DetailSection>
      )}

      {data.classes?.length > 0 && (
        <DetailSection title="Available To">
          <div className="flex flex-wrap gap-1">
            {data.classes.map((c: { name: string }) => (
              <Badge key={c.name} variant="secondary">
                {c.name}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  )
}

function MonsterDetail({ data }: { data: DetailData }) {
  const acValue = Array.isArray(data.armor_class)
    ? data.armor_class
        .map((a: { value: number; type: string }) => `${a.value} (${a.type})`)
        .join(', ')
    : data.armor_class

  const speed = data.speed
    ? Object.entries(data.speed as Record<string, string>)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k} ${v}`)
        .join(', ')
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {data.size && <Badge variant="outline">{data.size}</Badge>}
        {data.type && <Badge variant="outline">{data.type}</Badge>}
        {data.alignment && <Badge variant="secondary">{data.alignment}</Badge>}
      </div>

      <DetailSection title="Combat Stats">
        <DetailRow
          label="Challenge"
          value={`CR ${data.challenge_rating} · ${data.xp?.toLocaleString()} XP`}
        />
        <DetailRow label="Hit Points" value={`${data.hit_points} (${data.hit_dice})`} />
        <DetailRow label="Armor Class" value={acValue} />
        <DetailRow label="Speed" value={speed} />
      </DetailSection>

      <DetailSection title="Ability Scores">
        <AbilityGrid data={data} />
      </DetailSection>

      {data.proficiencies?.length > 0 && (
        <DetailSection title="Proficiencies">
          {data.proficiencies.map(
            (p: { proficiency: { name: string }; value: number }) => (
              <DetailRow
                key={p.proficiency.name}
                label={p.proficiency.name.replace('Saving Throw: ', 'Save: ')}
                value={`+${p.value}`}
              />
            ),
          )}
        </DetailSection>
      )}

      {(data.damage_immunities?.length > 0 ||
        data.damage_resistances?.length > 0 ||
        data.damage_vulnerabilities?.length > 0) && (
        <DetailSection title="Damage">
          {data.damage_immunities?.length > 0 && (
            <DetailRow label="Immunities" value={data.damage_immunities.join(', ')} />
          )}
          {data.damage_resistances?.length > 0 && (
            <DetailRow label="Resistances" value={data.damage_resistances.join(', ')} />
          )}
          {data.damage_vulnerabilities?.length > 0 && (
            <DetailRow
              label="Vulnerabilities"
              value={data.damage_vulnerabilities.join(', ')}
            />
          )}
          {data.condition_immunities?.length > 0 && (
            <DetailRow
              label="Cond. Immunities"
              value={data.condition_immunities
                .map((c: { name: string }) => c.name)
                .join(', ')}
            />
          )}
        </DetailSection>
      )}

      {(data.senses || data.languages) && (
        <DetailSection title="Senses & Languages">
          {data.senses &&
            Object.entries(data.senses as Record<string, string | number>)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <DetailRow key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
              ))}
          {data.languages && <DetailRow label="Languages" value={data.languages} />}
        </DetailSection>
      )}

      {data.special_abilities?.length > 0 && (
        <DetailSection title="Special Abilities">
          {data.special_abilities.map((a: { name: string; desc: string }) => (
            <div key={a.name} className="space-y-0.5">
              <p className="text-xs font-semibold">{a.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{a.desc}</p>
            </div>
          ))}
        </DetailSection>
      )}

      {data.actions?.length > 0 && (
        <DetailSection title="Actions">
          {data.actions.map((a: { name: string; desc: string }) => (
            <div key={a.name} className="space-y-0.5">
              <p className="text-xs font-semibold">{a.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{a.desc}</p>
            </div>
          ))}
        </DetailSection>
      )}

      {data.legendary_actions?.length > 0 && (
        <DetailSection title="Legendary Actions">
          {data.legendary_actions.map((a: { name: string; desc: string }) => (
            <div key={a.name} className="space-y-0.5">
              <p className="text-xs font-semibold">{a.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{a.desc}</p>
            </div>
          ))}
        </DetailSection>
      )}
    </div>
  )
}

function ClassDetail({ data }: { data: DetailData }) {
  const nonSaveProfs = (data.proficiencies as { index: string; name: string }[] ?? [])
    .filter((p) => !p.name.startsWith('Saving Throw'))

  return (
    <div className="space-y-4">
      {/* Overview */}
      <DetailSection title="Overview">
        <DetailRow label="Hit Die" value={`d${data.hit_die}`} />
        {data.spellcasting?.spellcasting_ability && (
          <DetailRow
            label="Spellcasting"
            value={`${data.spellcasting.spellcasting_ability.name} (starts at level ${data.spellcasting.level})`}
          />
        )}
      </DetailSection>

      {/* Saving Throws — use the direct saving_throws array */}
      {data.saving_throws?.length > 0 && (
        <DetailSection title="Saving Throws">
          <div className="flex flex-wrap gap-1">
            {(data.saving_throws as { name: string }[]).map((s) => (
              <Badge key={s.name} variant="secondary">
                {s.name}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Proficiencies */}
      {nonSaveProfs.length > 0 && (
        <DetailSection title="Proficiencies">
          <div className="flex flex-wrap gap-1">
            {nonSaveProfs.map((p) => (
              <Badge key={p.index} variant="outline">
                {p.name}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Skill choices — human-readable desc */}
      {data.proficiency_choices?.length > 0 && (
        <DetailSection title="Skill Choices">
          {(data.proficiency_choices as { desc: string }[]).map((pc, i) => (
            <p key={i} className="text-xs leading-relaxed">
              {pc.desc}
            </p>
          ))}
        </DetailSection>
      )}

      {/* Starting equipment */}
      {(data.starting_equipment?.length > 0 || data.starting_equipment_options?.length > 0) && (
        <DetailSection title="Starting Equipment">
          {(data.starting_equipment as { equipment: { name: string }; quantity: number }[] ?? []).map(
            (item) => (
              <p key={item.equipment.name} className="text-xs">
                {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.equipment.name}
              </p>
            ),
          )}
          {(data.starting_equipment_options as { desc: string }[] ?? []).map((opt, i) => (
            <p key={i} className="text-xs leading-relaxed text-muted-foreground">
              {opt.desc}
            </p>
          ))}
        </DetailSection>
      )}

      {/* Multiclassing prerequisites */}
      {data.multi_classing?.prerequisites?.length > 0 && (
        <DetailSection title="Multiclass Prerequisites">
          <div className="flex flex-wrap gap-1">
            {(data.multi_classing.prerequisites as { ability_score: { name: string }; minimum_score: number }[]).map(
              (req) => (
                <Badge key={req.ability_score.name} variant="secondary">
                  {req.ability_score.name} {req.minimum_score}+
                </Badge>
              ),
            )}
          </div>
        </DetailSection>
      )}

      {/* Spellcasting info sections */}
      {data.spellcasting?.info?.length > 0 && (
        <DetailSection title="Spellcasting">
          {(data.spellcasting.info as { name: string; desc: string[] }[]).map((section) => (
            <div key={section.name} className="space-y-1">
              <p className="text-xs font-semibold">{section.name}</p>
              <DescBlock lines={section.desc} />
            </div>
          ))}
        </DetailSection>
      )}

      {/* Subclasses */}
      {data.subclasses?.length > 0 && (
        <DetailSection title="Subclasses">
          <div className="flex flex-wrap gap-1">
            {(data.subclasses as { name: string }[]).map((s) => (
              <Badge key={s.name} variant="outline">
                {s.name}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  )
}

function EquipmentDetail({ data }: { data: DetailData }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {data.equipment_category?.name && (
          <Badge variant="outline">{data.equipment_category.name}</Badge>
        )}
        {data.weapon_category && (
          <Badge variant="secondary">{data.weapon_category}</Badge>
        )}
        {data.weapon_range && <Badge variant="secondary">{data.weapon_range}</Badge>}
      </div>

      <DetailSection title="Properties">
        <DetailRow
          label="Cost"
          value={data.cost ? `${data.cost.quantity} ${data.cost.unit}` : null}
        />
        <DetailRow label="Weight" value={data.weight ? `${data.weight} lb.` : null} />
        {data.damage && (
          <DetailRow
            label="Damage"
            value={`${data.damage.damage_dice} ${data.damage.damage_type?.name ?? ''}`}
          />
        )}
        {data.two_handed_damage && (
          <DetailRow
            label="Two-Handed"
            value={`${data.two_handed_damage.damage_dice} ${data.two_handed_damage.damage_type?.name ?? ''}`}
          />
        )}
        {data.range?.normal && (
          <DetailRow
            label="Range"
            value={`${data.range.normal}${data.range.long ? `/${data.range.long}` : ''} ft.`}
          />
        )}
        {data.properties?.length > 0 && (
          <DetailRow
            label="Properties"
            value={
              <div className="flex flex-wrap gap-1">
                {data.properties.map((p: { name: string }) => (
                  <Badge key={p.name} variant="secondary">
                    {p.name}
                  </Badge>
                ))}
              </div>
            }
          />
        )}
      </DetailSection>

      {data.desc?.length > 0 && (
        <DetailSection title="Description">
          <DescBlock lines={data.desc} />
        </DetailSection>
      )}
    </div>
  )
}

function MagicItemDetail({ data }: { data: DetailData }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {data.rarity?.name && <Badge variant="outline">{data.rarity.name}</Badge>}
        {data.equipment_category?.name && (
          <Badge variant="secondary">{data.equipment_category.name}</Badge>
        )}
      </div>

      {data.image && (
        <img
          src={`https://www.dnd5eapi.co${data.image}`}
          alt={data.name}
          className="w-full rounded-md object-contain"
        />
      )}

      {data.desc?.length > 0 && (
        <DetailSection title="Description">
          <DescBlock lines={data.desc} />
        </DetailSection>
      )}
    </div>
  )
}

function RaceDetail({ data }: { data: DetailData }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {data.size && <Badge variant="outline">{data.size} size</Badge>}
        {data.speed && <Badge variant="secondary">Speed {data.speed} ft.</Badge>}
      </div>

      {data.ability_bonuses?.length > 0 && (
        <DetailSection title="Ability Score Increases">
          <div className="flex flex-wrap gap-1">
            {data.ability_bonuses.map(
              (ab: { ability_score: { name: string }; bonus: number }) => (
                <Badge key={ab.ability_score.name} variant="secondary">
                  {ab.ability_score.name} +{ab.bonus}
                </Badge>
              ),
            )}
          </div>
        </DetailSection>
      )}

      <DetailSection title="Overview">
        {data.age && <DetailRow label="Age" value={data.age} />}
        {data.alignment && <DetailRow label="Alignment" value={data.alignment} />}
        {data.size_description && (
          <DetailRow label="Size" value={data.size_description} />
        )}
        {data.language_desc && (
          <DetailRow label="Languages" value={data.language_desc} />
        )}
      </DetailSection>

      {data.traits?.length > 0 && (
        <DetailSection title="Racial Traits">
          <div className="flex flex-wrap gap-1">
            {data.traits.map((t: { name: string }) => (
              <Badge key={t.name} variant="outline">
                {t.name}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}

      {data.subraces?.length > 0 && (
        <DetailSection title="Subraces">
          <div className="flex flex-wrap gap-1">
            {data.subraces.map((s: { name: string }) => (
              <Badge key={s.name} variant="secondary">
                {s.name}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  )
}

function ConditionDetail({ data }: { data: DetailData }) {
  return (
    <div className="space-y-4">
      {data.desc?.length > 0 && (
        <DetailSection title="Effects">
          <DescBlock lines={data.desc} />
        </DetailSection>
      )}
    </div>
  )
}

function SkillDetail({ data }: { data: DetailData }) {
  return (
    <div className="space-y-4">
      {data.ability_score?.name && (
        <div>
          <Badge variant="outline">{data.ability_score.name}</Badge>
        </div>
      )}
      {data.desc?.length > 0 && (
        <DetailSection title="Description">
          <DescBlock lines={data.desc} />
        </DetailSection>
      )}
    </div>
  )
}

function DetailView({ tab, data }: { tab: TabConfig; data: DetailData }) {
  switch (tab.key) {
    case 'spells':
      return <SpellDetail data={data} />
    case 'monsters':
      return <MonsterDetail data={data} />
    case 'classes':
      return <ClassDetail data={data} />
    case 'equipment':
      return <EquipmentDetail data={data} />
    case 'magic-items':
      return <MagicItemDetail data={data} />
    case 'races':
      return <RaceDetail data={data} />
    case 'conditions':
      return <ConditionDetail data={data} />
    case 'skills':
      return <SkillDetail data={data} />
    default:
      return null
  }
}

function DetailSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="pt-2">
        <Skeleton className="h-5 w-1/4" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Item grid (shared)
// ---------------------------------------------------------------------------

function ItemGrid({
  tab: _tab,
  items,
  loading,
  onItemClick,
}: {
  tab: TabConfig
  items: ApiItem[]
  loading: boolean
  onItemClick: (item: ApiItem) => void
}) {
  if (loading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    )
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No results found.</p>
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.index}
          type="button"
          onClick={() => onItemClick(item)}
          className="rounded-md border bg-card px-3 py-2.5 text-left text-sm font-medium capitalize text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {item.name}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail sheet (shared)
// ---------------------------------------------------------------------------

function DetailSheet({
  tab,
  selectedItem,
  detail,
  detailLoading,
  onClose,
}: {
  tab: TabConfig
  selectedItem: ApiItem | null
  detail: DetailData | null
  detailLoading: boolean
  onClose: () => void
}) {
  return (
    <Sheet open={!!selectedItem} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-105 flex-col sm:w-135">
        <SheetHeader className="border-b">
          <SheetTitle className="text-base">{selectedItem?.name}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {detailLoading ? (
            <DetailSkeleton />
          ) : detail ? (
            <DetailView tab={tab} data={detail} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Spell tab panel — class filter toggle + search
// ---------------------------------------------------------------------------

function SpellTabPanel({ tab }: { tab: TabConfig }) {
  const [search, setSearch] = useState('')
  const [activeClass, setActiveClass] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ApiItem | null>(null)

  const { items: allSpells, loading: spellsLoading } = useDndList('spells')
  const { items: classSpells, loading: classLoading } = useDndClassSpells(activeClass)
  const { data: detail, loading: detailLoading } = useDndDetail(
    tab.endpoint,
    selectedItem?.index ?? null,
  )

  const allItems = activeClass ? classSpells : allSpells
  const loading = activeClass ? classLoading : spellsLoading

  const filtered = search.trim()
    ? allItems.filter((item) =>
        item.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : allItems

  const handleItemClick = (item: ApiItem) => {
    setSelectedItem(item)
  }

  const toggleClass = (classIndex: string) => {
    setActiveClass((prev) => (prev === classIndex ? null : classIndex))
    setSearch('')
    setSelectedItem(null)
  }

  return (
    <div className="space-y-4">
      {/* Class filter row */}
      <div className="flex flex-wrap gap-1.5">
        {DND_CLASSES.map((cls) => (
          <button
            key={cls.index}
            type="button"
            onClick={() => toggleClass(cls.index)}
            className={[
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activeClass === cls.index
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground',
            ].join(' ')}
          >
            {cls.name}
          </button>
        ))}
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search spells…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {!loading && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} spell{filtered.length !== 1 ? 's' : ''}
            {activeClass && (
              <span className="ml-1">
                for{' '}
                {DND_CLASSES.find((c) => c.index === activeClass)?.name}
              </span>
            )}
          </span>
        )}
      </div>

      <ItemGrid
        tab={tab}
        items={filtered}
        loading={loading}
        onItemClick={handleItemClick}
      />

      <DetailSheet
        tab={tab}
        selectedItem={selectedItem}
        detail={detail}
        detailLoading={detailLoading}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Generic tab panel — search + all items
// ---------------------------------------------------------------------------

function TabPanel({ tab }: { tab: TabConfig }) {
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<ApiItem | null>(null)

  const { items: allItems, loading } = useDndList(tab.endpoint)
  const { data: detail, loading: detailLoading } = useDndDetail(
    tab.endpoint,
    selectedItem?.index ?? null,
  )

  const filtered = search.trim()
    ? allItems.filter((item) =>
        item.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : allItems

  const handleItemClick = (item: ApiItem) => {
    setSelectedItem(item)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder={`Search ${tab.label.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {!loading && allItems.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length !== allItems.length && `of ${allItems.length} `}
            {tab.label.toLowerCase()}
          </span>
        )}
      </div>

      <ItemGrid
        tab={tab}
        items={filtered}
        loading={loading}
        onItemClick={handleItemClick}
      />

      <DetailSheet
        tab={tab}
        selectedItem={selectedItem}
        detail={detail}
        detailLoading={detailLoading}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export function DndReferencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dungeons & Dragons 5E</h2>
        <p className="text-muted-foreground">
          Browse spells, monsters, equipment, and more from the 5e SRD.
        </p>
      </div>

      <Tabs defaultValue="spells">
        <TabsList className="flex-wrap">
          {DND_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {DND_TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-4">
            {tab.key === 'spells' ? (
              <SpellTabPanel tab={tab} />
            ) : (
              <TabPanel tab={tab} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
