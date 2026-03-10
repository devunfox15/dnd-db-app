import { useMemo, useState, useTransition } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { appRepository, useAppState } from '@/features/core/store'
import type { PlayerCharacter } from '@/features/core/types'
import {
  buildImportedPlayerCharacter,
  mergeImportedPlayerCharacter,
} from '@/features/player-characters/state'
import { importPlayerCharacter } from '@/features/player-characters/server/import-player-character'
import { refreshPlayerCharacter } from '@/features/player-characters/server/refresh-player-character'

function formatMod(value: number) {
  return value >= 0 ? `+${value}` : String(value)
}

export default function WorkspacePlayerPage({
  campaignId,
}: {
  campaignId: string
}) {
  const state = useAppState()
  const [search, setSearch] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const players = useMemo(() => {
    const query = search.trim().toLowerCase()
    return state.playerCharacters
      .filter((player) => player.campaignId === campaignId)
      .filter((player) => {
        if (!query) {
          return true
        }
        return JSON.stringify(player).toLowerCase().includes(query)
      })
  }, [campaignId, search, state.playerCharacters])

  function applyImportedCharacter(
    imported: Parameters<typeof buildImportedPlayerCharacter>[0],
  ) {
    const existing = appRepository
      .getState()
      .playerCharacters.find(
        (entry) =>
          entry.campaignId === campaignId &&
          entry.dndBeyondCharacterId === imported.dndBeyondCharacterId,
      )

    if (existing) {
      appRepository.update(
        'playerCharacters',
        existing.id,
        mergeImportedPlayerCharacter(existing, imported),
      )
      return
    }

    appRepository.create('playerCharacters', {
      ...buildImportedPlayerCharacter(imported),
      tags: [],
    })
  }

  function setCharacterStatus(
    character: PlayerCharacter,
    patch: Partial<PlayerCharacter>,
  ) {
    appRepository.update('playerCharacters', character.id, patch)
  }

  function handleImport() {
    const trimmed = importUrl.trim()
    if (!trimmed) {
      setFormError('Paste a D&D Beyond character URL to import.')
      return
    }

    setFormError(null)
    startTransition(async () => {
      try {
        const imported = await importPlayerCharacter({
          data: {
            campaignId,
            url: trimmed,
          },
        })
        applyImportedCharacter(imported)
        setImportUrl('')
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : 'Failed to import character.',
        )
      }
    })
  }

  async function refreshCharacter(character: PlayerCharacter) {
    setCharacterStatus(character, {
      importStatus: 'syncing',
      importError: null,
    })

    try {
      const result = await refreshPlayerCharacter({
        data: {
          campaignId,
          playerCharacterId: character.id,
          sourceUrl: character.sourceUrl,
          dndBeyondCharacterId: character.dndBeyondCharacterId,
        },
      })

      const latest = appRepository
        .list('playerCharacters')
        .find((entry) => entry.id === character.id)

      if (!latest) {
        return
      }

      appRepository.update(
        'playerCharacters',
        character.id,
        mergeImportedPlayerCharacter(latest, result.character),
      )
    } catch (error) {
      setCharacterStatus(character, {
        importStatus: 'error',
        importError:
          error instanceof Error
            ? error.message
            : 'Failed to refresh character.',
      })
    }
  }

  function handleRefreshParty() {
    const importedCharacters = appRepository
      .list('playerCharacters')
      .filter((player) => player.campaignId === campaignId)

    if (importedCharacters.length === 0) {
      return
    }

    startTransition(async () => {
      for (const character of importedCharacters) {
        await refreshCharacter(character)
      }
    })
  }

  function handleRemove(playerCharacterId: string) {
    appRepository.delete('playerCharacters', playerCharacterId)
  }

  return (
    <div className="min-h-full bg-stone-950 text-stone-100 p-4 space-y-4">
      {/* Import Form */}
      <div className="rounded border-2 border-amber-900/50 bg-stone-900/70 p-4">
        <div className="mb-3 text-[9px] font-black uppercase tracking-[0.25em] text-amber-700">
          Import Player Character
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input
            value={importUrl}
            onChange={(event) => setImportUrl(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleImport()
            }}
            placeholder="https://www.dndbeyond.com/characters/xxxxxxxxx"
            className="border-amber-900/40 bg-stone-900/50 text-stone-300 placeholder:text-stone-700 focus:border-amber-700/50"
          />
          <Button
            onClick={handleImport}
            disabled={isPending}
            variant="outline"
            className="cursor-pointer border-amber-900/60 text-amber-500 hover:border-amber-700 hover:bg-amber-900/20 hover:text-amber-300"
          >
            {isPending ? 'Importing…' : 'Import Character'}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-stone-600">
          Only public D&amp;D Beyond character URLs work here.
        </p>
        {formError ? (
          <p className="mt-1 text-[11px] text-red-400">{formError}</p>
        ) : null}
      </div>

      {/* Party Overview */}
      <div className="rounded border-2 border-amber-900/50 bg-stone-900/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-700">
            Party Overview
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshParty}
            disabled={isPending || players.length === 0}
            className="cursor-pointer border-amber-900/60 text-amber-500 hover:border-amber-700 hover:bg-amber-900/20 hover:text-amber-300"
          >
            {isPending ? 'Refreshing…' : 'Refresh Party'}
          </Button>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search player characters…"
          className="mb-4 border-amber-900/40 bg-stone-900/50 text-stone-300 placeholder:text-stone-700 focus:border-amber-700/50"
        />

        {players.length === 0 ? (
          <p className="text-sm italic text-stone-600">
            No player characters imported yet.
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {players.map((player) => {
              const hpPercent =
                player.maxHp > 0
                  ? Math.round((player.currentHp / player.maxHp) * 100)
                  : 0
              const hpBarColor =
                hpPercent > 50
                  ? '#16a34a'
                  : hpPercent > 25
                    ? '#d97706'
                    : '#dc2626'

              return (
                <div
                  key={player.id}
                  className="rounded border-2 border-amber-900/40 bg-stone-950/80 p-4 transition-colors hover:border-amber-800/60"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black tracking-wide text-amber-100">
                        {player.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        {player.race} &bull;{' '}
                        {player.classSummary || 'Unclassed'} &bull; Level{' '}
                        {player.level}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
                          player.importStatus === 'ready'
                            ? 'border-emerald-800 text-emerald-500'
                            : player.importStatus === 'error'
                              ? 'border-red-800 text-red-400'
                              : 'border-amber-800 text-amber-500'
                        }`}
                      >
                        {player.importStatus}
                      </span>
                      <Link
                        to="/campaigns/$campaignId/workspace/player-characters/$playerCharacterId"
                        params={{ campaignId, playerCharacterId: player.id }}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer border-amber-900/60 text-[10px] text-amber-500 hover:border-amber-700 hover:bg-amber-900/20 hover:text-amber-300"
                        >
                          Full Sheet
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-600">
                        HP
                      </span>
                      <span className="text-[11px] font-bold text-stone-400">
                        {player.currentHp} / {player.maxHp}
                        {player.tempHp > 0 && (
                          <span className="ml-2 text-sky-400">
                            +{player.tempHp} tmp
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-800">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${hpPercent}%`,
                          backgroundColor: hpBarColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Combat Stat Bubbles */}
                  <div className="mt-3 flex gap-2">
                    {[
                      {
                        label: 'AC',
                        value: player.armorClass,
                        color: 'text-amber-100',
                      },
                      {
                        label: 'Init',
                        value: formatMod(player.initiative),
                        color: 'text-emerald-300',
                      },
                      {
                        label: 'Speed',
                        value: `${player.speed}ft`,
                        color: 'text-sky-300',
                      },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="flex min-w-[48px] flex-col items-center rounded border border-amber-900/40 bg-stone-900/60 px-2.5 py-1.5"
                      >
                        <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700">
                          {label}
                        </span>
                        <span className={`text-sm font-black ${color}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Ability Scores */}
                  <div className="mt-3 grid grid-cols-6 gap-1">
                    {Object.entries(player.abilityScores).map(
                      ([ability, value]) => (
                        <div
                          key={ability}
                          className="flex flex-col items-center rounded border border-stone-800/60 bg-stone-900/50 px-0.5 py-1.5"
                        >
                          <span className="text-[7px] font-black uppercase tracking-wide text-amber-700">
                            {ability}
                          </span>
                          <span className="text-xs font-bold text-amber-100">
                            {value}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  {/* Conditions + Concentration */}
                  {(player.concentration || player.conditions.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {player.concentration && (
                        <span className="rounded border border-violet-800 bg-violet-950/50 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-300">
                          ✦ Concentrating
                        </span>
                      )}
                      {player.conditions.map((condition) => (
                        <span
                          key={condition}
                          className="rounded border border-red-800/60 bg-red-950/40 px-2 py-0.5 text-[9px] font-bold uppercase text-red-400"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(player.id)}
                      className="cursor-pointer border-stone-800 text-[10px] text-stone-600 hover:border-red-900 hover:text-red-400"
                    >
                      Remove
                    </Button>
                    {player.importError && (
                      <p className="text-[10px] text-red-400">
                        {player.importError}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
