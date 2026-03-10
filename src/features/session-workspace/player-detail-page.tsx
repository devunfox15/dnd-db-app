import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { appRepository, useAppState } from '@/features/core/store'
import type {
  PlayerCharacter,
  PlayerCharacterAction,
  PlayerCharacterFeatureTrait,
  PlayerCharacterInventoryItem,
  PlayerCharacterLabeledValue,
  PlayerCharacterSavingThrow,
  PlayerCharacterSkill,
} from '@/features/core/types'
import { mergeImportedPlayerCharacter } from '@/features/player-characters/state'
import { refreshPlayerCharacter } from '@/features/player-characters/server/refresh-player-character'

const ALLOWED_HTML_TAGS = new Set([
  'a',
  'b',
  'br',
  'caption',
  'div',
  'em',
  'hr',
  'i',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
])

const ALLOWED_STYLE_PROPERTIES = new Set([
  'background-color',
  'color',
  'display',
  'font-style',
  'font-weight',
  'text-align',
  'text-decoration',
])

function formatMod(value: number) {
  return value >= 0 ? `+${value}` : String(value)
}

function formatTimestamp(value: string | null) {
  if (!value) return 'Not synced yet'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizeDndBeyondInlineTags(html: string) {
  return html.replace(
    /\[spells\]([\s\S]*?)\[\/spells\]/gi,
    (_, rawLabel: string) => {
      const label = rawLabel.trim()
      if (!label) {
        return ''
      }

      const href = `https://www.dndbeyond.com/search?q=${encodeURIComponent(label)}&f=spells`
      return `<a href="${href}">${escapeHtml(label)}</a>`
    },
  )
}

function sanitizeStyleAttribute(styleValue: string) {
  return styleValue
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const [property, ...rest] = declaration.split(':')
      const normalizedProperty = property?.trim().toLowerCase()
      if (
        !normalizedProperty ||
        !ALLOWED_STYLE_PROPERTIES.has(normalizedProperty)
      ) {
        return null
      }

      const value = rest.join(':').trim()
      if (!value) {
        return null
      }

      return `${normalizedProperty}: ${value}`
    })
    .filter(Boolean)
    .join('; ')
}

function sanitizeRichText(html: string) {
  const normalized = normalizeDndBeyondInlineTags(html)
  const withoutDangerousBlocks = normalized
    .replace(
      /<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      '',
    )
    .replace(/<!--[\s\S]*?-->/g, '')

  return withoutDangerousBlocks.replace(
    /<\/?([a-z0-9-]+)([^>]*)>/gi,
    (match, rawTagName: string, rawAttributes: string) => {
      const tagName = rawTagName.toLowerCase()
      if (!ALLOWED_HTML_TAGS.has(tagName)) {
        return ''
      }

      if (match.startsWith('</')) {
        return `</${tagName}>`
      }

      const attrs: string[] = []
      const attributePattern =
        /([a-zA-Z-:]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g

      for (const attrMatch of rawAttributes.matchAll(attributePattern)) {
        const attrName = attrMatch[1]?.toLowerCase()
        const attrValue = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? ''

        if (!attrName || attrName.startsWith('on')) {
          continue
        }

        if (attrName === 'style') {
          const sanitizedStyle = sanitizeStyleAttribute(attrValue)
          if (sanitizedStyle) {
            attrs.push(`style="${escapeHtml(sanitizedStyle)}"`)
          }
          continue
        }

        if (attrName === 'href' && tagName === 'a') {
          if (/^(https?:|mailto:|#|\/)/i.test(attrValue)) {
            attrs.push(`href="${escapeHtml(attrValue)}"`)
            attrs.push('target="_blank"')
            attrs.push('rel="noreferrer noopener"')
          }
          continue
        }

        if (
          (attrName === 'colspan' || attrName === 'rowspan') &&
          (tagName === 'td' || tagName === 'th')
        ) {
          if (/^\d+$/.test(attrValue)) {
            attrs.push(`${attrName}="${attrValue}"`)
          }
          continue
        }
      }

      return `<${tagName}${attrs.length > 0 ? ` ${attrs.join(' ')}` : ''}>`
    },
  )
}

function RichText({
  html,
  className = '',
}: {
  html: string
  className?: string
}) {
  return (
    <div
      className={`text-[11px] leading-5 text-stone-300 [&_a]:text-amber-300 [&_a]:underline [&_em]:italic [&_li]:ml-4 [&_li]:list-disc [&_ol]:ml-4 [&_ol]:list-decimal [&_p+ul]:mt-2 [&_p]:mb-2 [&_strong]:font-semibold [&_table]:mt-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-stone-800/60 [&_td]:p-1.5 [&_th]:border [&_th]:border-stone-800/60 [&_th]:bg-stone-900/70 [&_th]:p-1.5 [&_tr:nth-child(even)]:bg-stone-900/30 [&_ul]:ml-4 [&_ul]:list-disc ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  )
}

const CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Exhausted',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
]

function SheetPanel({
  title,
  className = '',
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`relative rounded border-2 border-amber-900/50 bg-stone-950/50 ${className}`}
    >
      <div className="absolute -top-2.5 left-3 bg-stone-950 px-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-600">
          {title}
        </span>
      </div>
      <div className="p-3 pt-4">{children}</div>
    </div>
  )
}

function SidebarSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 border-b border-amber-900/30 pb-1 text-[8px] font-black uppercase tracking-[0.25em] text-amber-700">
        {title}
      </div>
      {children}
    </div>
  )
}

function KeyValueList({
  entries,
}: {
  entries: Array<[string, string | number | undefined]>
}) {
  const filtered = entries.filter(
    ([, value]) => value !== undefined && value !== '',
  )
  if (filtered.length === 0) {
    return (
      <p className="text-[11px] italic text-stone-600">No data imported.</p>
    )
  }

  return (
    <div className="space-y-2">
      {filtered.map(([label, value]) => (
        <div
          key={label}
          className="flex justify-between gap-3 border-b border-stone-800/40 pb-1.5 last:border-0"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
            {label}
          </span>
          <span className="text-right text-[11px] text-stone-300">{value}</span>
        </div>
      ))}
    </div>
  )
}

function PillList({ entries }: { entries: string[] }) {
  if (entries.length === 0) {
    return <p className="text-[11px] italic text-stone-600">None.</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map((entry) => (
        <span
          key={entry}
          className="rounded border border-amber-900/50 bg-stone-900/60 px-2 py-1 text-[10px] text-stone-300"
        >
          {entry}
        </span>
      ))}
    </div>
  )
}

function LabeledValues({ values }: { values: PlayerCharacterLabeledValue[] }) {
  if (values.length === 0) {
    return (
      <p className="text-[11px] italic text-stone-600">No data imported.</p>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {values.map((entry) => (
        <div
          key={`${entry.label}-${entry.value}`}
          className="rounded border border-stone-800/50 bg-stone-900/60 px-3 py-2"
        >
          <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
            {entry.label}
          </div>
          <div className="text-sm text-stone-200">{entry.value}</div>
        </div>
      ))}
    </div>
  )
}

function AbilityScoreColumn({ character }: { character: PlayerCharacter }) {
  const abilities = [
    ['STR', 'str'],
    ['DEX', 'dex'],
    ['CON', 'con'],
    ['INT', 'int'],
    ['WIS', 'wis'],
    ['CHA', 'cha'],
  ] as const

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {abilities.map(([abbr, key]) => {
        const score = character.abilityScores[key]
        const mod = Math.floor((score - 10) / 2)
        return (
          <div
            key={key}
            className="flex flex-col items-center rounded-lg border-2 border-amber-800/50 bg-stone-900/70 px-1 py-2.5"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">
              {abbr}
            </span>
            <span className="text-xl font-black leading-tight text-amber-100">
              {score}
            </span>
            <span className="text-[11px] font-bold text-stone-400">
              {formatMod(mod)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SavingThrowList({ values }: { values: PlayerCharacterSavingThrow[] }) {
  if (values.length === 0) {
    return (
      <p className="text-[11px] italic text-stone-600">
        No saving throws imported.
      </p>
    )
  }

  return (
    <div className="space-y-0.5">
      {values.map((entry) => (
        <div
          key={entry.ability}
          className="flex items-center justify-between border-b border-stone-800/30 px-1 py-1 last:border-0"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                entry.proficient
                  ? 'bg-emerald-500'
                  : 'border border-stone-600 bg-transparent'
              }`}
            />
            <span className="text-[11px] text-stone-300">{entry.label}</span>
          </div>
          <span className="w-8 text-right text-[11px] font-black text-amber-300">
            {formatMod(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function SkillList({ values }: { values: PlayerCharacterSkill[] }) {
  if (values.length === 0) {
    return (
      <p className="text-[11px] italic text-stone-600">No skills imported.</p>
    )
  }

  return (
    <div className="space-y-0.5">
      {values.map((entry) => (
        <div
          key={entry.key}
          className="flex items-center justify-between border-b border-stone-800/30 px-1 py-1 last:border-0"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                entry.proficient
                  ? 'bg-emerald-500'
                  : 'border border-stone-600 bg-transparent'
              }`}
            />
            <span className="text-[11px] text-stone-300">{entry.label}</span>
            <span className="text-[9px] uppercase text-stone-600">
              {entry.ability}
            </span>
          </div>
          <span className="w-8 text-right text-[11px] font-black text-amber-300">
            {formatMod(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function ActionList({ values }: { values: PlayerCharacterAction[] }) {
  if (values.length === 0) {
    return (
      <p className="text-[11px] italic text-stone-600">No actions imported.</p>
    )
  }

  return (
    <div className="space-y-2">
      {values.map((entry) => (
        <div
          key={entry.name}
          className="rounded border border-stone-800/50 bg-stone-900/50 px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-amber-100">
              {entry.name}
            </span>
            {entry.activationType ? (
              <span className="rounded border border-amber-900/50 px-1.5 py-0.5 text-[9px] uppercase text-amber-500">
                {entry.activationType}
              </span>
            ) : null}
            {entry.damage ? (
              <span className="text-[10px] text-stone-500">{entry.damage}</span>
            ) : null}
          </div>
          {entry.range ? (
            <div className="mt-1 text-[10px] text-stone-500">
              Range: {entry.range}
            </div>
          ) : null}
          {entry.description ? (
            <RichText html={entry.description} className="mt-2" />
          ) : null}
        </div>
      ))}
    </div>
  )
}

function FeatureList({ values }: { values: PlayerCharacterFeatureTrait[] }) {
  if (values.length === 0) {
    return (
      <p className="text-[11px] italic text-stone-600">No features imported.</p>
    )
  }

  return (
    <div className="space-y-2">
      {values.map((entry) => (
        <div
          key={`${entry.source}-${entry.name}`}
          className="rounded border border-stone-800/50 bg-stone-900/50 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-100">
              {entry.name}
            </span>
            <span className="text-[9px] uppercase tracking-[0.15em] text-amber-700">
              {entry.source}
            </span>
          </div>
          {entry.description ? (
            <RichText html={entry.description} className="mt-2" />
          ) : null}
        </div>
      ))}
    </div>
  )
}

function SpellList({ values }: { values: PlayerCharacter['sheet']['spells'] }) {
  if (values.length === 0) {
    return (
      <p className="text-[11px] italic text-stone-600">No spells imported.</p>
    )
  }

  return (
    <div className="space-y-2">
      {values.map((entry) => (
        <div
          key={entry.name}
          className="rounded border border-stone-800/50 bg-stone-900/50 px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-violet-200">
              {entry.name}
            </span>
            <span className="text-[9px] uppercase tracking-[0.15em] text-violet-400">
              Level {entry.level}
            </span>
            <span className="rounded border border-violet-900/50 px-1.5 py-0.5 text-[9px] uppercase text-violet-300">
              {entry.source}
            </span>
            {entry.school ? (
              <span className="text-[9px] text-stone-500">{entry.school}</span>
            ) : null}
            {entry.concentration ? (
              <span className="text-[9px] uppercase text-amber-500">
                Concentration
              </span>
            ) : null}
            {entry.ritual ? (
              <span className="text-[9px] uppercase text-sky-400">Ritual</span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-stone-500">
            {entry.activationType ? (
              <span>Casting Time: {entry.activationType}</span>
            ) : null}
            {entry.range ? <span>Range: {entry.range}</span> : null}
            {entry.duration ? <span>Duration: {entry.duration}</span> : null}
            {entry.components?.length ? (
              <span>Components: {entry.components.join(', ')}</span>
            ) : null}
            {entry.usesSpellSlot ? (
              <span>Uses spell slot</span>
            ) : (
              <span>No spell slot</span>
            )}
          </div>
          {entry.componentsDescription ? (
            <div className="mt-1 text-[10px] text-stone-500">
              Materials: {entry.componentsDescription}
            </div>
          ) : null}
          {entry.tags?.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <span
                  key={`${entry.name}-${tag}`}
                  className="rounded border border-stone-700/60 px-1.5 py-0.5 text-[9px] text-stone-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {entry.description ? (
            <RichText html={entry.description} className="mt-2" />
          ) : null}
        </div>
      ))}
    </div>
  )
}

function InventoryList({ values }: { values: PlayerCharacterInventoryItem[] }) {
  if (values.length === 0) {
    return (
      <p className="text-[11px] italic text-stone-600">
        No inventory imported.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {values.map((entry) => (
        <div
          key={`${entry.name}-${entry.quantity}-${entry.container ?? 'root'}`}
          className="rounded border border-stone-800/50 bg-stone-900/50 px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-stone-200">
              {entry.name}
            </span>
            <span className="text-[10px] text-stone-500">
              x{entry.quantity}
            </span>
            {entry.equipped ? (
              <span className="rounded border border-emerald-900/50 px-1.5 py-0.5 text-[9px] uppercase text-emerald-400">
                Equipped
              </span>
            ) : null}
            {entry.isAttuned ? (
              <span className="rounded border border-violet-900/50 px-1.5 py-0.5 text-[9px] uppercase text-violet-300">
                Attuned
              </span>
            ) : null}
            {entry.type ? (
              <span className="text-[10px] text-stone-500">{entry.type}</span>
            ) : null}
            {entry.subtype ? (
              <span className="text-[10px] text-stone-500">
                {entry.subtype}
              </span>
            ) : null}
            {entry.rarity ? (
              <span className="rounded border border-amber-900/50 px-1.5 py-0.5 text-[9px] uppercase text-amber-300">
                {entry.rarity}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-stone-500">
            {entry.detail ? <span>{entry.detail}</span> : null}
            {entry.container ? <span>Container: {entry.container}</span> : null}
          </div>
          {entry.properties?.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {entry.properties.map((property) => (
                <span
                  key={`${entry.name}-${property}`}
                  className="rounded border border-stone-700/60 px-1.5 py-0.5 text-[9px] text-stone-400"
                >
                  {property}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export default function WorkspacePlayerDetailPage({
  campaignId,
  playerCharacterId,
}: {
  campaignId: string
  playerCharacterId: string
}) {
  const state = useAppState()
  const [isPending, startTransition] = useTransition()
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('actions')

  const character = state.playerCharacters.find(
    (entry) =>
      entry.campaignId === campaignId && entry.id === playerCharacterId,
  )

  if (!character) {
    return (
      <div className="flex h-40 items-center justify-center rounded border-2 border-dashed border-amber-900/40 text-sm text-amber-800">
        Character not found.
      </div>
    )
  }

  const currentCharacter = character
  const hpPercent =
    currentCharacter.maxHp > 0
      ? Math.round((currentCharacter.currentHp / currentCharacter.maxHp) * 100)
      : 0
  const hpBarColor =
    hpPercent > 50 ? '#16a34a' : hpPercent > 25 ? '#d97706' : '#dc2626'

  function updateCharacter(patch: Partial<PlayerCharacter>) {
    appRepository.update('playerCharacters', currentCharacter.id, patch)
  }

  function adjustNumber(field: 'currentHp' | 'tempHp', delta: number) {
    const nextValue = Math.max(0, currentCharacter[field] + delta)
    updateCharacter({ [field]: nextValue } as Pick<
      PlayerCharacter,
      typeof field
    >)
  }

  function handleRefresh() {
    setRefreshError(null)
    updateCharacter({ importStatus: 'syncing', importError: null })
    startTransition(async () => {
      try {
        const result = await refreshPlayerCharacter({
          data: {
            campaignId,
            playerCharacterId: currentCharacter.id,
            sourceUrl: currentCharacter.sourceUrl,
            dndBeyondCharacterId: currentCharacter.dndBeyondCharacterId,
          },
        })
        const latest = appRepository
          .list('playerCharacters')
          .find((entry) => entry.id === currentCharacter.id)
        if (!latest) return
        appRepository.update(
          'playerCharacters',
          currentCharacter.id,
          mergeImportedPlayerCharacter(latest, result.character),
        )
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to refresh character.'
        setRefreshError(message)
        updateCharacter({ importStatus: 'error', importError: message })
      }
    })
  }

  const { sheet } = currentCharacter

  return (
    <div className="flex h-full flex-col bg-stone-950 text-stone-100">
      {/* Header */}
      <div className="border-b-2 border-amber-900/50 bg-gradient-to-r from-stone-950 via-stone-900/80 to-stone-950 px-5 py-4 flex-shrink-0">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-700/60 to-transparent" />
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-700">
            Character Sheet
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-700/60 to-transparent" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-wide text-amber-100">
              {currentCharacter.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              {[
                ['Class', currentCharacter.classSummary || 'Unclassed'],
                ['Race', currentCharacter.race],
                ['Source', currentCharacter.importSource],
                ['Last Sync', formatTimestamp(currentCharacter.lastSyncedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-amber-700">
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-stone-200">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                currentCharacter.importStatus === 'ready'
                  ? 'border-emerald-800 text-emerald-500'
                  : currentCharacter.importStatus === 'error'
                    ? 'border-red-800 text-red-400'
                    : 'border-amber-800 text-amber-500'
              }`}
            >
              {currentCharacter.importStatus}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isPending}
              className="cursor-pointer border-amber-900/60 text-amber-500 hover:border-amber-700 hover:bg-amber-900/20 hover:text-amber-300"
            >
              {isPending ? 'Syncing…' : 'Sync Character'}
            </Button>
          </div>
        </div>
      </div>

      {/* Combat Stats Bar */}
      <div className="flex-shrink-0 border-b border-amber-900/30 bg-stone-900/60 px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Stat Bubbles */}
          {[
            {
              label: 'AC',
              value: currentCharacter.armorClass,
              color: 'text-amber-100',
            },
            {
              label: 'Initiative',
              value: formatMod(currentCharacter.initiative),
              color: 'text-emerald-300',
            },
            {
              label: 'Speed',
              value: `${currentCharacter.speed} ft`,
              color: 'text-sky-300',
            },
            {
              label: 'Level',
              value: currentCharacter.level,
              color: 'text-amber-100',
            },
            {
              label: 'Prof Bonus',
              value: `+${sheet.proficiencyBonus}`,
              color: 'text-violet-300',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex min-w-[56px] flex-col items-center rounded-lg border-2 border-amber-800/60 bg-stone-900/80 px-3 py-2"
            >
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-amber-700">
                {label}
              </span>
              <span className={`text-xl font-black leading-tight ${color}`}>
                {value}
              </span>
            </div>
          ))}

          {/* HP Section */}
          <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-lg border border-red-900/40 bg-stone-900/60 px-4 py-2">
            {/* Current HP */}
            <div className="flex flex-col items-center">
              <div className="text-[8px] font-black uppercase tracking-widest text-red-600">
                HP
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => adjustNumber('currentHp', -1)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-red-900/60 font-black text-red-400 transition-colors hover:bg-red-950/60 hover:text-red-300"
                >
                  −
                </button>
                <span className="min-w-[2.5rem] text-center text-3xl font-black leading-none text-red-400">
                  {currentCharacter.currentHp}
                </span>
                <button
                  onClick={() => adjustNumber('currentHp', 1)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-emerald-900/60 font-black text-emerald-400 transition-colors hover:bg-emerald-950/60 hover:text-emerald-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* HP Bar + Max */}
            <div className="flex flex-1 flex-col gap-1">
              <div className="text-right text-[9px] text-stone-500">
                / {currentCharacter.maxHp} max
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-800">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${hpPercent}%`,
                    backgroundColor: hpBarColor,
                  }}
                />
              </div>
            </div>

            {/* Temp HP */}
            <div className="flex flex-col items-center">
              <div className="text-[8px] font-black uppercase tracking-widest text-sky-600">
                Temp
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustNumber('tempHp', -1)}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-sky-900/60 text-sm font-black text-sky-400 transition-colors hover:bg-sky-950/60 hover:text-sky-300"
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center text-lg font-black leading-none text-sky-400">
                  {currentCharacter.tempHp}
                </span>
                <button
                  onClick={() => adjustNumber('tempHp', 1)}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-sky-900/60 text-sm font-black text-sky-300 transition-colors hover:bg-sky-950/60 hover:text-sky-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-52 flex-shrink-0 overflow-y-auto border-r border-amber-900/30 bg-stone-950 lg:w-56">
          <div className="space-y-4 p-3">
            <SidebarSection title="Ability Scores">
              <AbilityScoreColumn character={currentCharacter} />
            </SidebarSection>

            <SidebarSection title="Saving Throws">
              <SavingThrowList values={sheet.savingThrows} />
            </SidebarSection>

            <SidebarSection title="Skills">
              <SkillList values={sheet.skills} />
            </SidebarSection>

            <SidebarSection title="Senses">
              <LabeledValues values={sheet.senses} />
            </SidebarSection>
          </div>
        </aside>

        {/* Main Tabbed Content */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full flex-col"
          >
            <div className="shrink-0 border-b border-amber-900/40 bg-stone-950 px-4 pt-3">
              <TabsList
                variant="line"
                className="h-auto w-full flex-wrap justify-start rounded-none bg-transparent"
              >
                {[
                  { value: 'actions', label: 'Actions' },
                  { value: 'spells', label: 'Spells' },
                  { value: 'features', label: 'Features & Traits' },
                  { value: 'inventory', label: 'Inventory' },
                  { value: 'background', label: 'Background & Notes' },
                ].map(({ value, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex-none rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-xs font-semibold text-stone-500 hover:text-stone-300 data-active:border-amber-600 data-active:text-amber-300"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="actions" className="flex-1 overflow-y-auto p-4">
              <ActionList values={sheet.actions} />
            </TabsContent>

            <TabsContent value="spells" className="flex-1 overflow-y-auto p-4">
              <SpellList values={sheet.spells} />
            </TabsContent>

            <TabsContent value="features" className="flex-1 overflow-y-auto p-4">
              <FeatureList values={sheet.featuresAndTraits} />
            </TabsContent>

            <TabsContent value="inventory" className="flex-1 overflow-y-auto p-4">
              <InventoryList values={sheet.inventory} />
            </TabsContent>

            <TabsContent
              value="background"
              className="flex-1 space-y-5 overflow-y-auto p-4"
            >
              <SheetPanel title="Background">
                {sheet.background ? (
                  <div className="space-y-3">
                    <KeyValueList
                      entries={[
                        ['Name', sheet.background.name],
                        ['Feature', sheet.background.featureName],
                      ]}
                    />
                    {sheet.background.description ? (
                      <RichText html={sheet.background.description} />
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                          Proficiencies
                        </div>
                        <PillList entries={sheet.background.proficiencies} />
                      </div>
                      <div>
                        <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                          Tools
                        </div>
                        <PillList entries={sheet.background.tools} />
                      </div>
                      <div>
                        <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                          Feats
                        </div>
                        <PillList entries={sheet.background.feats} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                        Equipment
                      </div>
                      <PillList entries={sheet.background.equipment} />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] italic text-stone-600">
                    No background imported.
                  </p>
                )}
              </SheetPanel>

              <SheetPanel title="Proficiencies & Training">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                      Languages
                    </div>
                    <PillList
                      entries={sheet.proficienciesAndTraining.languages}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                      Armor
                    </div>
                    <PillList entries={sheet.proficienciesAndTraining.armor} />
                  </div>
                  <div>
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                      Weapons
                    </div>
                    <PillList
                      entries={sheet.proficienciesAndTraining.weapons}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                      Tools
                    </div>
                    <PillList entries={sheet.proficienciesAndTraining.tools} />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                      Other
                    </div>
                    <PillList entries={sheet.proficienciesAndTraining.other} />
                  </div>
                </div>
              </SheetPanel>

              <SheetPanel title="Speed">
                <LabeledValues values={sheet.speed} />
              </SheetPanel>

              <SheetPanel title="Notes">
                {sheet.notes ? (
                  <div className="space-y-3">
                    {[
                      ['Allies', sheet.notes.allies],
                      ['Enemies', sheet.notes.enemies],
                      ['Organizations', sheet.notes.organizations],
                      ['Backstory', sheet.notes.backstory],
                      ['Personality', sheet.notes.personalityTraits],
                      ['Ideals', sheet.notes.ideals],
                      ['Bonds', sheet.notes.bonds],
                      ['Flaws', sheet.notes.flaws],
                      ['Appearance', sheet.notes.appearance],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div
                          key={label}
                          className="border-b border-stone-800/40 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">
                            {label}
                          </div>
                          <RichText html={value ?? ''} />
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[11px] italic text-stone-600">
                    No notes imported.
                  </p>
                )}
              </SheetPanel>

              <SheetPanel title="Extra">
                {sheet.extra ? (
                  <KeyValueList
                    entries={[
                      ['Gender', sheet.extra.gender],
                      ['Age', sheet.extra.age],
                      ['Faith', sheet.extra.faith],
                      ['Hair', sheet.extra.hair],
                      ['Eyes', sheet.extra.eyes],
                      ['Skin', sheet.extra.skin],
                      ['Height', sheet.extra.height],
                      ['Weight', sheet.extra.weight],
                      ['Inspiration', sheet.extra.inspiration],
                      ['CP', sheet.extra.cp],
                      ['SP', sheet.extra.sp],
                      ['GP', sheet.extra.gp],
                      ['EP', sheet.extra.ep],
                      ['PP', sheet.extra.pp],
                    ]}
                  />
                ) : (
                  <p className="text-[11px] italic text-stone-600">
                    No extra details imported.
                  </p>
                )}
              </SheetPanel>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Aside */}
        <aside className="w-48 shrink-0 overflow-y-auto border-l border-amber-900/30 bg-stone-950 lg:w-52">
          <div className="space-y-4 p-3">
            <SidebarSection title="Conditions">
              <div className="flex flex-wrap gap-1">
                {CONDITIONS.map((condition) => {
                  const active = currentCharacter.conditions.includes(condition)
                  return (
                    <button
                      key={condition}
                      onClick={() => {
                        const nextConditions = active
                          ? currentCharacter.conditions.filter(
                              (c) => c !== condition,
                            )
                          : [...currentCharacter.conditions, condition]
                        updateCharacter({ conditions: nextConditions })
                      }}
                      className={`cursor-pointer rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider transition-all duration-150 ${
                        active
                          ? 'border-red-700 bg-red-950/60 text-red-300'
                          : 'border-stone-800 bg-stone-900/30 text-stone-600 hover:border-red-900 hover:text-red-500'
                      }`}
                    >
                      {condition}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() =>
                  updateCharacter({
                    concentration: !currentCharacter.concentration,
                  })
                }
                className={`mt-2 w-full cursor-pointer rounded border-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200 ${
                  currentCharacter.concentration
                    ? 'border-violet-700 bg-violet-950/60 text-violet-300'
                    : 'border-stone-800 bg-stone-900/40 text-stone-600 hover:border-violet-900 hover:text-violet-500'
                }`}
              >
                {currentCharacter.concentration
                  ? '✦ Concentrating'
                  : 'Concentration'}
              </button>
            </SidebarSection>

            <SidebarSection title="Session Notes">
              <Textarea
                value={currentCharacter.quickNotes}
                onChange={(event) =>
                  updateCharacter({ quickNotes: event.target.value })
                }
                placeholder="Notes for this session…"
                className="min-h-[90px] border-amber-900/40 bg-stone-900/50 text-xs text-stone-300 placeholder:text-stone-700 focus:border-amber-700/50"
              />
              {(refreshError || currentCharacter.importError) && (
                <p className="mt-2 text-[10px] text-red-400">
                  {refreshError || currentCharacter.importError}
                </p>
              )}
            </SidebarSection>

            <SidebarSection title="Resistances">
              <PillList entries={sheet.defense.resistances} />
            </SidebarSection>

            <SidebarSection title="Immunities">
              <PillList entries={sheet.defense.immunities} />
            </SidebarSection>

            <SidebarSection title="Advantages">
              <PillList entries={sheet.defense.advantages} />
            </SidebarSection>
          </div>
        </aside>
      </div>
    </div>
  )
}
