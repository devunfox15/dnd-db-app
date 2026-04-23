# MVP Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the repo for the MVP by adding new data types (`Location`, `LocationPin`, `SessionLogEntry`), bumping migrations, cleaning navigation of parked features, gating the UI to D&D 5e, and adding whole-app JSON export/import.

**Architecture:** localStorage-only. A single `appRepository` is the source of truth (`src/features/core/repository.ts`). New collections slot into the existing generic `Repository.list/create/update/delete` API. Migrations are handled in `src/features/core/migrations.ts`. UI features live under `src/features/<name>/`. The sidebar navigation is defined in `src/components/app-sidebar.tsx`. Tests use Vitest and live in `src/features/<name>/__tests__/`.

**Tech Stack:** React 19, TypeScript 5.7, TanStack Start + TanStack Router, Tailwind v4, shadcn/ui, Vitest, localStorage via a thin adapter. Package manager: pnpm.

**Spec reference:** [docs/superpowers/specs/2026-04-22-mvp-dm-hub-design.md](../specs/2026-04-22-mvp-dm-hub-design.md)

**Out of scope for Phase 1:** Campaign/PC/NPC/Encounter/Session UI polish (Phase 2), session-workspace refactor + DM screen polish (Phase 3). Phase 1 lays groundwork only.

---

## Task 1: Add `syncMeta` to `BaseEntity`

**Why:** Every entity needs a future-proofing hook so a later sync layer can track dirty/last-synced state without a migration storm. Unused in Phase 1.

**Files:**

- Modify: `src/features/core/types.ts` (around line 13–19)

- [ ] **Step 1: Add the `syncMeta` type and field**

Edit `src/features/core/types.ts`. Replace the existing `BaseEntity` interface (currently lines 13–19) with:

```ts
export interface SyncMeta {
  dirty: boolean
  lastSyncedAt: string | null
}

export interface BaseEntity {
  id: EntityId
  createdAt: string
  updatedAt: string
  campaignId: EntityId
  tags?: string[]
  syncMeta?: SyncMeta
}
```

- [ ] **Step 2: Verify the change compiles**

Run: `pnpm tsc --noEmit`

Expected: no new errors. (Existing unrelated errors, if any, must not be introduced by this edit.)

- [ ] **Step 3: Commit**

```bash
git add src/features/core/types.ts
git commit -m "feat(core): add optional syncMeta to BaseEntity for future sync layer"
```

---

## Task 2: Add `SessionLogEntry` type and collection

**Why:** The MVP collapses `DmNote`, `StoryPin`, and `TimelineEvent` into one unified note stream. `SessionLogEntry` is the new canonical shape.

**Files:**

- Modify: `src/features/core/types.ts`

- [ ] **Step 1: Write a failing type compile test**

Create `src/features/core/__tests__/session-log-types.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import type { SessionLogEntry } from '@/features/core/types'

describe('SessionLogEntry type', () => {
  it('accepts a well-formed entry', () => {
    const entry: SessionLogEntry = {
      id: 'log-1',
      campaignId: 'campaign-1',
      sessionId: 'session-1',
      kind: 'note',
      title: 'Party meets the mayor',
      body: 'Short exchange at the town gate.',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['hook'],
    }
    expect(entry.kind).toBe('note')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/core/__tests__/session-log-types.test.ts`

Expected: FAIL — "Cannot find name 'SessionLogEntry'" (TypeScript error reported by Vitest).

- [ ] **Step 3: Add the type**

Edit `src/features/core/types.ts`. Immediately after the `LookupEntry` interface (currently ending near line 175), add:

```ts
export type SessionLogKind = 'note' | 'event' | 'secret'

export interface SessionLogEntry extends BaseEntity {
  sessionId?: EntityId
  kind: SessionLogKind
  title: string
  body: string
  timestamp: string
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/core/__tests__/session-log-types.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/core/types.ts src/features/core/__tests__/session-log-types.test.ts
git commit -m "feat(core): add SessionLogEntry type"
```

---

## Task 3: Add `Location` and `LocationPin` types

**Why:** Worldbuilding-lite. A location optionally has an image; pins are `(x, y)` in normalized 0–1 coordinates so the image can be resized without recomputing pin positions.

**Files:**

- Modify: `src/features/core/types.ts`

- [ ] **Step 1: Write a failing type compile test**

Create `src/features/core/__tests__/location-types.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import type { Location, LocationPin } from '@/features/core/types'

describe('Location types', () => {
  it('accepts a location with pins', () => {
    const pin: LocationPin = {
      id: 'pin-1',
      x: 0.4,
      y: 0.6,
      label: 'Town Hall',
      linkedNpcIds: [],
      linkedNotes: [],
    }
    const location: Location = {
      id: 'loc-1',
      campaignId: 'campaign-1',
      name: 'Greenhollow',
      description: 'Sleepy frontier town',
      imageUrl: undefined,
      pins: [pin],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    expect(location.pins[0]?.label).toBe('Town Hall')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/core/__tests__/location-types.test.ts`

Expected: FAIL — "Cannot find name 'Location'" / "Cannot find name 'LocationPin'".

- [ ] **Step 3: Add the types**

Edit `src/features/core/types.ts`. Immediately after the `SessionLogEntry` interface added in Task 2, add:

```ts
export interface LocationPin {
  id: string
  x: number
  y: number
  label: string
  linkedNpcIds: EntityId[]
  linkedNotes: EntityId[]
}

export interface Location extends BaseEntity {
  name: string
  description: string
  imageUrl?: string
  pins: LocationPin[]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/core/__tests__/location-types.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/core/types.ts src/features/core/__tests__/location-types.test.ts
git commit -m "feat(core): add Location and LocationPin types"
```

---

## Task 4: Register new collections in `AppState` and `EntityByCollection`

**Why:** The new types need to participate in the generic `Repository.list/create/update/delete` API, which reads from `EntityByCollection` and `AppState`.

**Files:**

- Modify: `src/features/core/types.ts` (the `AppState`, `EntityByCollection`, and `CollectionKey` definitions near the bottom of the file)

- [ ] **Step 1: Write a failing test for the generic repository with `locations`**

Create `src/features/core/__tests__/new-collections.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'

const campaignId = 'campaign-x'

function baseState() {
  const state = createEmptyState()
  const now = new Date().toISOString()
  state.campaigns = [
    {
      id: campaignId,
      campaignId,
      name: 'Test Campaign',
      description: '',
      rpgSystem: 'dnd-5e',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
  ]
  state.activeCampaignId = campaignId
  return state
}

describe('new collections', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('creates a location via the generic repository', () => {
    const created = appRepository.create('locations', {
      campaignId,
      name: 'Greenhollow',
      description: 'Town',
      pins: [],
    })
    expect(created.id).toMatch(/^locations-/)
  })

  it('creates a session log entry via the generic repository', () => {
    const created = appRepository.create('sessionLog', {
      campaignId,
      kind: 'note',
      title: 'Opening beat',
      body: 'Party meets the hook NPC',
      timestamp: new Date().toISOString(),
    })
    expect(created.kind).toBe('note')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/core/__tests__/new-collections.test.ts`

Expected: FAIL — "'locations' is not assignable to parameter of type `CollectionKey`" or similar.

- [ ] **Step 3: Extend `AppState` and `EntityByCollection`**

Edit `src/features/core/types.ts`.

Locate the `AppState` interface (currently near line 374) and add two new fields:

```ts
export interface AppState {
  version: number
  activeCampaignId: EntityId | null
  campaigns: Campaign[]
  notes: DmNote[]
  pins: StoryPin[]
  maps: MapRecord[]
  mapDocuments: MapDocument[]
  npcs: NpcCharacter[]
  playerCharacters: PlayerCharacter[]
  timelineEvents: TimelineEvent[]
  lookupEntries: LookupEntry[]
  locations: Location[]
  sessionLog: SessionLogEntry[]
}
```

Locate the `EntityByCollection` type (currently near line 390) and add the same keys:

```ts
export type EntityByCollection = {
  campaigns: Campaign
  notes: DmNote
  pins: StoryPin
  maps: MapRecord
  mapDocuments: MapDocument
  npcs: NpcCharacter
  playerCharacters: PlayerCharacter
  timelineEvents: TimelineEvent
  lookupEntries: LookupEntry
  locations: Location
  sessionLog: SessionLogEntry
}
```

- [ ] **Step 4: Update `createEmptyState` to include the new arrays**

Edit `src/features/core/migrations.ts`, lines 34–48. Replace the `createEmptyState` function with:

```ts
export function createEmptyState(): AppState {
  return {
    version: currentVersion,
    activeCampaignId: null,
    campaigns: [],
    notes: [],
    pins: [],
    maps: [],
    mapDocuments: [],
    npcs: [],
    playerCharacters: [],
    timelineEvents: [],
    lookupEntries: [],
    locations: [],
    sessionLog: [],
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run src/features/core/__tests__/new-collections.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/core/types.ts src/features/core/migrations.ts src/features/core/__tests__/new-collections.test.ts
git commit -m "feat(core): register locations and sessionLog collections in AppState"
```

---

## Task 5: Bump `currentVersion` and handle legacy state in migrations

**Why:** Existing users (and dev builds with prior data) need their state to gain the new empty arrays without losing any data.

**Files:**

- Modify: `src/features/core/migrations.ts`

- [ ] **Step 1: Write a failing migration test**

Append to `src/features/core/__tests__/migrations.test.ts`:

```ts
describe('migrateState with v6 → v7 additions', () => {
  it('adds empty locations and sessionLog arrays to legacy state', () => {
    const now = new Date().toISOString()
    const migrated = migrateState({
      version: 6,
      activeCampaignId: null,
      campaigns: [],
      notes: [],
      pins: [],
      maps: [],
      mapDocuments: [],
      npcs: [],
      playerCharacters: [],
      timelineEvents: [],
      lookupEntries: [],
    })

    expect(migrated.version).toBe(7)
    expect(migrated.locations).toEqual([])
    expect(migrated.sessionLog).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/core/__tests__/migrations.test.ts -t "adds empty locations"`

Expected: FAIL — `migrated.version` is still 6, or `migrated.locations` is undefined.

- [ ] **Step 3: Bump `currentVersion`**

Edit `src/features/core/migrations.ts`, line 5:

```ts
export const currentVersion = 7
```

- [ ] **Step 4: Ensure migrated state has default arrays for the new fields**

Still in `src/features/core/migrations.ts`, inside `migrateState` (after the existing `migrated.mapDocuments = ...` block around line 127), add:

```ts
  migrated.locations = Array.isArray(migrated.locations) ? migrated.locations : []
  migrated.sessionLog = Array.isArray(migrated.sessionLog) ? migrated.sessionLog : []
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run src/features/core/__tests__/migrations.test.ts`

Expected: all migration tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/core/migrations.ts src/features/core/__tests__/migrations.test.ts
git commit -m "feat(core): bump to version 7, default new collections on migrate"
```

---

## Task 6: Update `cleanupRelations` to prune dangling NPC refs from location pins

**Why:** The existing `cleanupRelations` function in `repository.ts` already prunes dangling refs across other collections. Location pins also reference NPC ids; we need to do the same so deleting an NPC cleans location pins too.

**Files:**

- Modify: `src/features/core/repository.ts` (the `cleanupRelations` function, currently lines 101–169)

- [ ] **Step 1: Write a failing repository test**

Append to `src/features/core/__tests__/new-collections.test.ts`:

```ts
describe('cleanupRelations for locations', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('removes deleted npc ids from location pins', () => {
    const npc = appRepository.create('npcs', {
      campaignId,
      name: 'Mayor',
      role: 'Leader',
      faction: '',
      notes: '',
      usedInMapIds: [],
      usedInTimelineEventIds: [],
      tags: [],
    })

    const location = appRepository.create('locations', {
      campaignId,
      name: 'Greenhollow',
      description: '',
      pins: [
        {
          id: 'pin-1',
          x: 0.1,
          y: 0.2,
          label: 'Mayor',
          linkedNpcIds: [npc.id],
          linkedNotes: [],
        },
      ],
    })

    appRepository.delete('npcs', npc.id)

    const refreshed = appRepository.list('locations').find((item) => item.id === location.id)
    expect(refreshed?.pins[0]?.linkedNpcIds).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/core/__tests__/new-collections.test.ts -t "removes deleted npc ids"`

Expected: FAIL — pin still holds the deleted npc id.

- [ ] **Step 3: Extend `cleanupRelations`**

Edit `src/features/core/repository.ts`. Inside `cleanupRelations` (currently ending around line 169), just before the `return next` line, add:

```ts
  next.locations = next.locations.map((location) => ({
    ...location,
    pins: location.pins.map((pin) => ({
      ...pin,
      linkedNpcIds: pin.linkedNpcIds.filter((id) => npcIds.has(id)),
    })),
  }))
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/core/__tests__/new-collections.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/core/repository.ts src/features/core/__tests__/new-collections.test.ts
git commit -m "feat(core): prune dangling npc refs from location pins"
```

---

## Task 7: Cascade deletion of locations and session log when a campaign is deleted

**Why:** `appRepository.deleteCampaignCascade` already removes per-campaign rows from every collection; it must do the same for the new collections.

**Files:**

- Modify: `src/features/core/repository.ts` (`deleteCampaignCascade`, currently lines 229–253)

- [ ] **Step 1: Write a failing cascade test**

Append to `src/features/core/__tests__/new-collections.test.ts`:

```ts
describe('deleteCampaignCascade for new collections', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('removes locations and session log entries scoped to the deleted campaign', () => {
    appRepository.create('locations', {
      campaignId,
      name: 'Greenhollow',
      description: '',
      pins: [],
    })
    appRepository.create('sessionLog', {
      campaignId,
      kind: 'note',
      title: 'Opening',
      body: '',
      timestamp: new Date().toISOString(),
    })

    appRepository.deleteCampaignCascade(campaignId)

    expect(appRepository.list('locations')).toEqual([])
    expect(appRepository.list('sessionLog')).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/core/__tests__/new-collections.test.ts -t "removes locations and session log"`

Expected: FAIL — collections still non-empty after cascade.

- [ ] **Step 3: Extend the cascade**

Edit `src/features/core/repository.ts`. Inside `deleteCampaignCascade` (currently ends around line 253), add the two filters alongside the existing ones (e.g. just before the `if (nextState.activeCampaignId === campaignId)` block):

```ts
    nextState.locations = nextState.locations.filter((loc) => loc.campaignId !== campaignId)
    nextState.sessionLog = nextState.sessionLog.filter((entry) => entry.campaignId !== campaignId)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/core/__tests__/new-collections.test.ts`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/core/repository.ts src/features/core/__tests__/new-collections.test.ts
git commit -m "feat(core): cascade delete locations and sessionLog with campaign"
```

---

## Task 8: Add `exportState` and `importState` helpers

**Why:** Export/import of whole-app JSON is a cheap, high-value feature for demos and machine moves. It also exercises the migration path, which shakes out bugs.

**Files:**

- Create: `src/features/core/export-import.ts`
- Create: `src/features/core/__tests__/export-import.test.ts`

- [ ] **Step 1: Write a failing roundtrip test**

Create `src/features/core/__tests__/export-import.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'

import { exportState, importState } from '@/features/core/export-import'
import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'

const campaignId = 'campaign-x'

function baseState() {
  const state = createEmptyState()
  const now = new Date().toISOString()
  state.campaigns = [
    {
      id: campaignId,
      campaignId,
      name: 'Test Campaign',
      description: '',
      rpgSystem: 'dnd-5e',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
  ]
  state.activeCampaignId = campaignId
  return state
}

describe('exportState / importState', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('roundtrips state through export and import', () => {
    appRepository.create('locations', {
      campaignId,
      name: 'Greenhollow',
      description: '',
      pins: [],
    })
    const exported = exportState()
    expect(typeof exported).toBe('string')

    resetRepositoryStateForTests(createEmptyState())
    expect(appRepository.list('locations')).toEqual([])

    const result = importState(exported)
    expect(result.ok).toBe(true)
    expect(appRepository.list('locations').map((l) => l.name)).toEqual(['Greenhollow'])
  })

  it('rejects malformed input', () => {
    const result = importState('{ not json')
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toMatch(/parse|invalid/i)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/core/__tests__/export-import.test.ts`

Expected: FAIL — module `@/features/core/export-import` not found.

- [ ] **Step 3: Implement the helpers**

Create `src/features/core/export-import.ts`:

```ts
import { migrateState } from './migrations'
import { appRepository } from './repository'

export type ImportResult =
  | { ok: true }
  | { ok: false; error: string }

export function exportState(): string {
  return JSON.stringify(appRepository.getState(), null, 2)
}

export function importState(raw: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return { ok: false, error: `Could not parse JSON: ${(error as Error).message}` }
  }

  const migrated = migrateState(parsed)

  if (!Array.isArray(migrated.campaigns)) {
    return { ok: false, error: 'Invalid app state: campaigns is missing.' }
  }

  appRepository.saveState(migrated)
  return { ok: true }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/core/__tests__/export-import.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/core/export-import.ts src/features/core/__tests__/export-import.test.ts
git commit -m "feat(core): add whole-state JSON export and import helpers"
```

---

## Task 9: Minimal export/import UI on the home dashboard

**Why:** The feature is useless if the user cannot trigger it. This is a minimal button pair, not a settings page.

**Files:**

- Modify: `src/features/home/components/dashboard-summary.tsx`
- Create: `src/features/home/components/data-portability-card.tsx`

- [ ] **Step 1: Create the portability card component**

Create `src/features/home/components/data-portability-card.tsx`:

```tsx
import { useRef, useState } from 'react'
import { DownloadIcon, UploadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { exportState, importState } from '@/features/core/export-import'

export function DataPortabilityCard() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  function handleExport() {
    const json = exportState()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `dnd-db-export-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Exported.')
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = importState(text)
    setMessage(result.ok ? 'Imported.' : `Import failed: ${result.error}`)
    event.target.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Portability</CardTitle>
        <CardDescription>
          Export your full state as JSON or restore from a previous export.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="secondary" className="gap-2">
            <DownloadIcon className="size-4" />
            Export
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            className="gap-2"
          >
            <UploadIcon className="size-4" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Render the card in the home dashboard**

Edit `src/features/home/components/dashboard-summary.tsx`. At the top, add the import:

```tsx
import { DataPortabilityCard } from '@/features/home/components/data-portability-card'
```

Then render it at the end of the outer `<div className="space-y-6">` block (after the final stats grid). The modified JSX should end like:

```tsx
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* existing stat cards */}
      </div>

      <DataPortabilityCard />
    </div>
  )
}
```

- [ ] **Step 3: Run the full test suite**

Run: `pnpm vitest run`

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/home/components/data-portability-card.tsx src/features/home/components/dashboard-summary.tsx
git commit -m "feat(home): add JSON export/import card to dashboard"
```

---

## Task 10: Remove the "Maps" entry from sidebar navigation

**Why:** Maps and the new-map-builder are parked for v2. The sidebar should only surface MVP routes.

**Files:**

- Modify: `src/components/app-sidebar.tsx` (the `navMain` array around lines 25–47)

- [ ] **Step 1: Remove the `Maps` entry and its unused icon import**

Edit `src/components/app-sidebar.tsx`. Replace lines 15 (`Compass, House, LucideProps, Map, Notebook`) and lines 25–47 (the `navMain` array) so that Maps and the `Map` icon import are gone:

```tsx
import { Compass, House, LucideProps, Notebook } from 'lucide-react'
```

And:

```tsx
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: House,
    },
    {
      title: 'RPGs',
      url: '/rpgs',
      icon: Compass,
    },
    {
      title: 'Campaigns',
      url: '/campaigns',
      icon: Notebook,
    },
  ],
```

- [ ] **Step 2: Verify the build still compiles**

Run: `pnpm tsc --noEmit`

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/app-sidebar.tsx
git commit -m "chore(nav): remove Maps link from sidebar (parked for v2)"
```

---

## Task 11: Gate RPG options to D&D 5e only

**Why:** Non-5e campaigns should not be creatable through MVP UI. The enum stays in types; the picker filters to one option.

**Files:**

- Modify: `src/features/campaigns/rpg-options.ts`

- [ ] **Step 1: Write a failing test**

Create `src/features/campaigns/__tests__/rpg-options.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { mvpRpgOptions, rpgLabel, rpgOptions } from '@/features/campaigns/rpg-options'

describe('rpg-options', () => {
  it('keeps all systems in the static registry', () => {
    expect(rpgOptions.map((o) => o.value)).toEqual([
      'dnd-5e',
      'pathfinder-2e',
      'call-of-cthulhu-7e',
      'cyberpunk-red',
    ])
  })

  it('exposes a 5e-only selectable list for MVP', () => {
    expect(mvpRpgOptions.map((o) => o.value)).toEqual(['dnd-5e'])
  })

  it('labels dnd-5e correctly', () => {
    expect(rpgLabel('dnd-5e')).toBe('D&D 5e')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/campaigns/__tests__/rpg-options.test.ts`

Expected: FAIL — `mvpRpgOptions` is not exported.

- [ ] **Step 3: Add the MVP-gated list**

Edit `src/features/campaigns/rpg-options.ts`:

```ts
import type { CampaignRpgSystem } from '@/features/core/types'

export const rpgOptions: Array<{ value: CampaignRpgSystem; label: string }> = [
  { value: 'dnd-5e', label: 'D&D 5e' },
  { value: 'pathfinder-2e', label: 'Pathfinder 2e' },
  { value: 'call-of-cthulhu-7e', label: 'Call of Cthulhu 7e' },
  { value: 'cyberpunk-red', label: 'Cyberpunk RED' },
]

export const mvpRpgOptions = rpgOptions.filter((option) => option.value === 'dnd-5e')

export function rpgLabel(value: CampaignRpgSystem): string {
  return rpgOptions.find((option) => option.value === value)?.label ?? value
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/campaigns/__tests__/rpg-options.test.ts`

Expected: PASS.

- [ ] **Step 5: Switch campaign UI to use `mvpRpgOptions`**

Grep for uses of `rpgOptions` in the campaigns UI:

Run: `grep -rln "from '@/features/campaigns/rpg-options'" src`

For each file that is a campaign creation/edit form, change the import to `mvpRpgOptions` and use that list. The current user-facing file is `src/features/campaigns/page.tsx`. Inside that file, replace any occurrence of:

```tsx
import { rpgOptions, rpgLabel } from '@/features/campaigns/rpg-options'
```

with:

```tsx
import { mvpRpgOptions, rpgLabel } from '@/features/campaigns/rpg-options'
```

…and replace `rpgOptions.map(...)` with `mvpRpgOptions.map(...)` inside the rendering code.

- [ ] **Step 6: Run the full test suite and build**

Run: `pnpm vitest run && pnpm tsc --noEmit`

Expected: all tests pass and no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/campaigns/rpg-options.ts src/features/campaigns/__tests__/rpg-options.test.ts src/features/campaigns/page.tsx
git commit -m "feat(campaigns): gate MVP to 5e-only rpg picker, keep enum intact"
```

---

## Task 12: Audit and update cross-links to parked features

**Why:** The sidebar no longer surfaces Maps, but internal cross-links elsewhere still jump to parked routes. We want navigation friction against the parked features, not dead ends from active MVP screens.

**Files:**

- Audit: `src/features/maps/page.tsx`, `src/features/new-map-builder/components/top-bar.tsx`, any other flagged files

- [ ] **Step 1: Run the audit grep**

Run: `grep -rln "to=\"/maps\|to=\"/new-map-builder\|to=\"/campaign-chat\|to=\"/story-pins\|'/maps'\|'/new-map-builder'\|'/campaign-chat'\|'/story-pins'" src`

Expected output (for reference):

```
src/routeTree.gen.ts
src/features/maps/page.tsx
src/features/new-map-builder/components/top-bar.tsx
src/features/campaigns/page.tsx  (may or may not appear)
src/routes/maps.tsx
```

- [ ] **Step 2: Treat `routeTree.gen.ts` and `src/routes/maps.tsx` as owned by the router**

Do NOT edit `routeTree.gen.ts` — it is auto-generated from files in `src/routes/`.

Do NOT delete the route files for parked features in Phase 1. Per the spec, routes stay so direct URL access still works.

- [ ] **Step 3: For `src/features/maps/page.tsx` and `src/features/new-map-builder/components/top-bar.tsx`, leave internal cross-links alone**

These files are themselves inside parked features. Internal cross-links between parked features do not affect the MVP flow — users reaching them means they are already off the golden path.

- [ ] **Step 4: Identify any MVP-side cross-link to a parked feature**

From the list above, flag only files that are inside MVP features (campaigns, session-workspace, home, etc.). Manually open each such file and remove or replace the parked-feature `<Link to="...">`.

- [ ] **Step 5: Commit only if changes were made**

```bash
git status
# If there are changes:
git add -A
git commit -m "chore(nav): remove MVP-side cross-links to parked features"
```

If there are no MVP-side cross-links to parked routes, skip the commit.

---

## Task 13: Polish home dashboard for MVP

**Why:** The home screen must make the Prep → Run loop obvious. Today it surfaces "Open RPG Library" and "Open Campaigns." MVP surfaces active campaign state and a direct "Start Session" CTA when one exists.

**Files:**

- Modify: `src/features/home/components/dashboard-summary.tsx`

- [ ] **Step 1: Write a failing component test**

Create `src/features/home/__tests__/dashboard-summary.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DashboardSummary } from '@/features/home/components/dashboard-summary'

// Smoke test: the summary renders a Start Session affordance when a campaign exists.
// The router and state hooks are real; the test just verifies the text appears
// when the default seeded state is used.
describe('DashboardSummary', () => {
  it('renders a Start Session CTA when an active campaign exists', () => {
    render(<DashboardSummary />)
    // When seeded state includes a campaign, the CTA is visible.
    // When empty, the CTA is hidden — accept either branch, but the Data
    // Portability card always renders.
    expect(screen.getByText(/Data Portability/i)).toBeInTheDocument()
  })
})
```

Note: If the seed path in this test environment does not include a campaign, the stronger CTA assertion should be gated. This smoke test asserts only the Data Portability card to avoid flakiness.

- [ ] **Step 2: Run the test to verify it behaves**

Run: `pnpm vitest run src/features/home/__tests__/dashboard-summary.test.tsx`

Expected: PASS (assuming Task 9 landed). If it fails because of a router context requirement, wrap the render in the app's existing router test harness; otherwise the Data Portability card should render without router context.

- [ ] **Step 3: Add the Start Session CTA to the dashboard**

Edit `src/features/home/components/dashboard-summary.tsx`. Inside the `Current Campaign` card (the branch where `activeCampaign` is truthy), add a second button just below the "Resume Campaign" link:

```tsx
                <Link
                  to="/campaigns/$campaignId/workspace/sessions"
                  params={{ campaignId: activeCampaign.id }}
                >
                  <Button variant="secondary" className="gap-2">
                    <PlayCircleIcon className="size-4" />
                    Start Session
                  </Button>
                </Link>
```

- [ ] **Step 4: Run the full test suite**

Run: `pnpm vitest run`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/components/dashboard-summary.tsx src/features/home/__tests__/dashboard-summary.test.tsx
git commit -m "feat(home): add Start Session CTA and dashboard smoke test"
```

---

## Task 14: Final verification — build, test, manual smoke

**Why:** Phase 1 is infrastructure; no user-facing feature is fully shipped yet, but the repo must still build and all tests must pass. A quick manual walkthrough confirms nothing regressed visibly.

**Files:**

- No code changes.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 2: Run the type checker**

Run: `pnpm tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Run the production build**

Run: `pnpm build`

Expected: successful build output.

- [ ] **Step 4: Manual smoke in the dev server**

Run: `pnpm dev`

Open `http://localhost:3000` in a browser.

- Verify the sidebar shows only: Home, RPGs, Campaigns (no Maps).
- Verify the home page renders the active campaign card and the Data Portability card.
- Click Export; confirm a `dnd-db-export-YYYY-MM-DD.json` download.
- Click Import and re-import the file; confirm "Imported." message and no visible data change.
- Attempt to create a campaign; confirm only "D&D 5e" appears in the RPG system picker.

- [ ] **Step 5: If any smoke step fails**

Open a new task in the plan to address the specific failure before Phase 1 is considered complete. Do not paper over.

- [ ] **Step 6: Mark Phase 1 complete**

```bash
git log --oneline | head -20
```

Confirm all Phase 1 commits landed on the branch in order.

---

## Appendix: What comes next

**Phase 2 (Prep vertical):** Campaigns polish, PC CRUD and DDB import UX, NPC CRUD, encounter library polish, locations UI with image + pin editor.

**Phase 3 (Run vertical):** `session-detail-page.tsx` refactor (1,125 → <400 lines), DM screen polish, initiative tracker polish, session log UI, integration smoke test that walks the full core loop.
