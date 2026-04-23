# MVP Phase 2 — Locations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the worldbuilding-lite Locations feature end-to-end: list locations per campaign, add/upload an image per location, place and edit pins on the image, link pins to NPCs. Replaces the parked hex-map-builder delegation at the workspace Locations tab.

**Architecture:** A new, small `features/locations/` module. Data model (`Location`, `LocationPin`) already exists in `core/types.ts` from Phase 1. Image data is stored inline as a data URL on `Location.imageUrl` with a size cap (2 MB) to stay within localStorage quotas. Pin coordinates are normalized to 0–1 space so the image can be resized without recomputing positions. Drag and click interactions use native Pointer Events; no additional dependency needed. The existing workspace nav already has a "Locations" tab pointing to the correct route.

**Tech Stack:** React 19, TypeScript, TanStack Router (file-based routes), Tailwind v4 + shadcn/ui, Vitest + @testing-library/react, native Pointer Events for drag.

**Spec reference:** [docs/superpowers/specs/2026-04-22-mvp-dm-hub-design.md](../specs/2026-04-22-mvp-dm-hub-design.md) §5.5, §7 (Add: Location / LocationPin), §8 (features/locations)

**Out of scope for Phase 2:** The Figma hex map builder remains parked. Cosmetic polish on campaigns/PC/NPC/encounter pages is deferred — those pages are already MVP-usable.

---

## File Structure

**New files:**

- `src/features/locations/pin-math.ts` — pure helpers: `toNormalizedCoords`, `toPixelCoords`, `clampCoord`.
- `src/features/locations/image-intake.ts` — pure helper: `readFileAsDataUrl` with size validation.
- `src/features/locations/list-page.tsx` — list view component.
- `src/features/locations/detail-page.tsx` — single-location view: name/description edit, image upload, pin overlay.
- `src/features/locations/components/pin-overlay.tsx` — the interactive image + pins overlay.
- `src/features/locations/components/pin-popover.tsx` — the label + linked-NPC editor for a selected pin.
- `src/features/locations/__tests__/pin-math.test.ts`
- `src/features/locations/__tests__/image-intake.test.ts`
- `src/features/locations/__tests__/list-page.test.tsx`
- `src/features/locations/__tests__/detail-page.test.tsx`
- `src/routes/campaigns.$campaignId.workspace.locations.$locationId.tsx` — new detail route.

**Modified files:**

- `src/routes/campaigns.$campaignId.workspace.locations.tsx` — render the new list page instead of the old delegation.

**Removed files:**

- `src/features/session-workspace/locations-page.tsx` — old delegation to the parked hex map builder.

Each file owns a single responsibility: math helpers, image reading, list UI, detail UI, pin overlay, pin popover.

---

## Task 1: Pin coordinate math helpers

**Why:** Pin coordinates are normalized to 0–1 relative to the image. The list page, overlay, and drag handler all need the same conversions. Isolating this as pure functions makes the rest of the code trivially testable.

**Files:**

- Create: `src/features/locations/pin-math.ts`
- Create: `src/features/locations/__tests__/pin-math.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/locations/__tests__/pin-math.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  clampCoord,
  toNormalizedCoords,
  toPixelCoords,
} from '@/features/locations/pin-math'

describe('pin-math', () => {
  it('converts pixel coordinates to normalized values in [0, 1]', () => {
    const result = toNormalizedCoords(
      { x: 200, y: 100 },
      { width: 400, height: 200 },
    )
    expect(result).toEqual({ x: 0.5, y: 0.5 })
  })

  it('converts normalized coordinates back to pixels', () => {
    const result = toPixelCoords(
      { x: 0.25, y: 0.75 },
      { width: 400, height: 200 },
    )
    expect(result).toEqual({ x: 100, y: 150 })
  })

  it('clamps out-of-range values to the [0, 1] interval', () => {
    expect(clampCoord(-0.3)).toBe(0)
    expect(clampCoord(1.2)).toBe(1)
    expect(clampCoord(0.5)).toBe(0.5)
  })

  it('clamps the pixel→normalized result when pointer is outside the image', () => {
    const result = toNormalizedCoords(
      { x: -50, y: 300 },
      { width: 400, height: 200 },
    )
    expect(result).toEqual({ x: 0, y: 1 })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/locations/__tests__/pin-math.test.ts`

Expected: FAIL — module `@/features/locations/pin-math` not found.

- [ ] **Step 3: Implement the helpers**

Create `src/features/locations/pin-math.ts`:

```ts
export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export function clampCoord(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function toNormalizedCoords(point: Point, size: Size): Point {
  if (size.width <= 0 || size.height <= 0) {
    return { x: 0, y: 0 }
  }
  return {
    x: clampCoord(point.x / size.width),
    y: clampCoord(point.y / size.height),
  }
}

export function toPixelCoords(normalized: Point, size: Size): Point {
  return {
    x: normalized.x * size.width,
    y: normalized.y * size.height,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/locations/__tests__/pin-math.test.ts`

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/locations/pin-math.ts src/features/locations/__tests__/pin-math.test.ts
git commit -m "feat(locations): add pin coordinate math helpers"
```

---

## Task 2: Image intake (file → data URL with size cap)

**Why:** Users upload images that must fit in localStorage. 2 MB per image caps total state under the typical 5–10 MB origin quota once other data is accounted for. Isolating file reading here keeps the UI component thin.

**Files:**

- Create: `src/features/locations/image-intake.ts`
- Create: `src/features/locations/__tests__/image-intake.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/locations/__tests__/image-intake.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import { MAX_IMAGE_BYTES, readFileAsDataUrl } from '@/features/locations/image-intake'

function makeFile({
  name = 'map.png',
  type = 'image/png',
  bytes = 100,
}: { name?: string; type?: string; bytes?: number } = {}): File {
  const blob = new Uint8Array(bytes)
  return new File([blob], name, { type })
}

describe('image-intake', () => {
  it('resolves to a data URL for an accepted image', async () => {
    const file = makeFile({ bytes: 10 })

    // jsdom FileReader; mock readAsDataURL to a known string
    const spy = vi
      .spyOn(FileReader.prototype, 'readAsDataURL')
      .mockImplementation(function readImpl(this: FileReader) {
        Object.defineProperty(this, 'result', {
          value: 'data:image/png;base64,AAAA',
          configurable: true,
        })
        this.onload?.(new ProgressEvent('load'))
      })

    const result = await readFileAsDataUrl(file)
    expect(result.ok).toBe(true)
    expect(result.ok === true && result.dataUrl).toBe('data:image/png;base64,AAAA')

    spy.mockRestore()
  })

  it('rejects files above the size cap', async () => {
    const file = makeFile({ bytes: MAX_IMAGE_BYTES + 1 })
    const result = await readFileAsDataUrl(file)
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toMatch(/too large/i)
  })

  it('rejects non-image mime types', async () => {
    const file = makeFile({ type: 'text/plain', name: 'not-an-image.txt' })
    const result = await readFileAsDataUrl(file)
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toMatch(/image/i)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/locations/__tests__/image-intake.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper**

Create `src/features/locations/image-intake.ts`:

```ts
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB

export type IntakeResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string }

export function readFileAsDataUrl(file: File): Promise<IntakeResult> {
  if (!file.type.startsWith('image/')) {
    return Promise.resolve({
      ok: false,
      error: `File must be an image (got "${file.type || 'unknown'}").`,
    })
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Promise.resolve({
      ok: false,
      error: `Image is too large (${Math.round(file.size / 1024)} KB; max ${Math.round(MAX_IMAGE_BYTES / 1024)} KB).`,
    })
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const value = reader.result
      if (typeof value === 'string') {
        resolve({ ok: true, dataUrl: value })
      } else {
        resolve({ ok: false, error: 'Unexpected file contents.' })
      }
    }
    reader.onerror = () => {
      resolve({ ok: false, error: reader.error?.message ?? 'Failed to read file.' })
    }
    reader.readAsDataURL(file)
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/locations/__tests__/image-intake.test.ts`

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/locations/image-intake.ts src/features/locations/__tests__/image-intake.test.ts
git commit -m "feat(locations): add image intake helper with size and type checks"
```

---

## Task 3: Locations list page — scaffold and render existing locations

**Why:** The user needs a campaign-scoped list view before they can drill into a location. Starts with read-only rendering so we commit a working page before adding the create flow.

**Files:**

- Create: `src/features/locations/list-page.tsx`
- Create: `src/features/locations/__tests__/list-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/locations/__tests__/list-page.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

import LocationsListPage from '@/features/locations/list-page'
import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}))

const campaignId = 'campaign-1'

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

describe('LocationsListPage', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('renders an empty-state hint when no locations exist', () => {
    const markup = renderToStaticMarkup(
      createElement(LocationsListPage, { campaignId }),
    )
    expect(markup).toContain('No locations yet')
  })

  it('renders each location with its name and description', () => {
    appRepository.create('locations', {
      campaignId,
      name: 'Greenhollow',
      description: 'Sleepy frontier town',
      pins: [],
    })

    const markup = renderToStaticMarkup(
      createElement(LocationsListPage, { campaignId }),
    )
    expect(markup).toContain('Greenhollow')
    expect(markup).toContain('Sleepy frontier town')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/locations/__tests__/list-page.test.tsx`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement a minimal list page**

Create `src/features/locations/list-page.tsx`:

```tsx
import { Link } from '@tanstack/react-router'
import { MapPinIcon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAppState } from '@/features/core/store'

interface LocationsListPageProps {
  campaignId: string
}

export default function LocationsListPage({ campaignId }: LocationsListPageProps) {
  const state = useAppState()
  const locations = state.locations.filter(
    (location) => location.campaignId === campaignId,
  )

  if (locations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <MapPinIcon className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No locations yet. Add one to start mapping your world.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {locations.map((location) => (
        <Link
          key={location.id}
          to="/campaigns/$campaignId/workspace/locations/$locationId"
          params={{ campaignId, locationId: location.id }}
        >
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader>
              <CardTitle className="text-base">{location.name}</CardTitle>
              <CardDescription>{location.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {location.pins.length} pin{location.pins.length === 1 ? '' : 's'}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/locations/__tests__/list-page.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/locations/list-page.tsx src/features/locations/__tests__/list-page.test.tsx
git commit -m "feat(locations): add read-only locations list page"
```

---

## Task 4: Create-location flow on the list page

**Why:** Users need to create the first location. Adding the mutation at the list level keeps the detail page focused on editing a known-existing location.

**Files:**

- Modify: `src/features/locations/list-page.tsx`
- Modify: `src/features/locations/__tests__/list-page.test.tsx`

- [ ] **Step 1: Write the failing test (append to existing suite)**

Append to `src/features/locations/__tests__/list-page.test.tsx`, inside the `describe('LocationsListPage'` block:

```tsx
  it('creates a location via the repository when the create form is submitted', async () => {
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react')
    vi.stubGlobal('document', window.document)

    try {
      render(createElement(LocationsListPage, { campaignId }))

      // The create form is always visible in MVP — no dialog.
      const nameInput = screen.getByPlaceholderText(/location name/i) as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: 'The Broken Anvil' } })

      const submit = screen.getByRole('button', { name: /add location/i })
      fireEvent.click(submit)

      const created = appRepository
        .list('locations')
        .find((l) => l.name === 'The Broken Anvil')
      expect(created).toBeDefined()
      expect(created?.campaignId).toBe(campaignId)
      expect(nameInput.value).toBe('')
    } finally {
      cleanup()
    }
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/locations/__tests__/list-page.test.tsx`

Expected: FAIL — placeholder and/or submit button not found.

- [ ] **Step 3: Add the inline create form**

Replace the body of `LocationsListPage` in `src/features/locations/list-page.tsx` with:

```tsx
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MapPinIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { appRepository, useAppState } from '@/features/core/store'

interface LocationsListPageProps {
  campaignId: string
}

export default function LocationsListPage({ campaignId }: LocationsListPageProps) {
  const state = useAppState()
  const locations = state.locations.filter(
    (location) => location.campaignId === campaignId,
  )
  const [draftName, setDraftName] = useState('')

  function handleCreate() {
    const trimmed = draftName.trim()
    if (!trimmed) return
    appRepository.create('locations', {
      campaignId,
      name: trimmed,
      description: '',
      pins: [],
    })
    setDraftName('')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleCreate()
          }}
          placeholder="Location name"
          className="max-w-xs"
        />
        <Button onClick={handleCreate} disabled={!draftName.trim()}>
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <MapPinIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No locations yet. Add one to start mapping your world.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <Link
              key={location.id}
              to="/campaigns/$campaignId/workspace/locations/$locationId"
              params={{ campaignId, locationId: location.id }}
            >
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base">{location.name}</CardTitle>
                  <CardDescription>{location.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {location.pins.length} pin{location.pins.length === 1 ? '' : 's'}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/locations/__tests__/list-page.test.tsx`

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/locations/list-page.tsx src/features/locations/__tests__/list-page.test.tsx
git commit -m "feat(locations): add inline create form on list page"
```

---

## Task 5: Detail route + detail page scaffold (name + description editing)

**Why:** Establish the second-level route before adding image/pin features, so link navigation from the list works end-to-end.

**Files:**

- Create: `src/routes/campaigns.$campaignId.workspace.locations.$locationId.tsx`
- Create: `src/features/locations/detail-page.tsx`
- Create: `src/features/locations/__tests__/detail-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/locations/__tests__/detail-page.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

import LocationDetailPage from '@/features/locations/detail-page'
import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}))

const campaignId = 'campaign-1'

function baseStateWithLocation(): { locationId: string } {
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
  resetRepositoryStateForTests(state)
  const created = appRepository.create('locations', {
    campaignId,
    name: 'Greenhollow',
    description: 'Frontier town',
    pins: [],
  })
  return { locationId: created.id }
}

describe('LocationDetailPage', () => {
  let locationId = ''

  beforeEach(() => {
    locationId = baseStateWithLocation().locationId
  })

  it('renders the location name and description', () => {
    const markup = renderToStaticMarkup(
      createElement(LocationDetailPage, { campaignId, locationId }),
    )
    expect(markup).toContain('Greenhollow')
    expect(markup).toContain('Frontier town')
  })

  it('renders a not-found state for an unknown id', () => {
    const markup = renderToStaticMarkup(
      createElement(LocationDetailPage, { campaignId, locationId: 'missing-id' }),
    )
    expect(markup).toContain('Location not found')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/locations/__tests__/detail-page.test.tsx`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the detail page**

Create `src/features/locations/detail-page.tsx`:

```tsx
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { appRepository, useAppState } from '@/features/core/store'

interface LocationDetailPageProps {
  campaignId: string
  locationId: string
}

export default function LocationDetailPage({
  campaignId,
  locationId,
}: LocationDetailPageProps) {
  const state = useAppState()
  const location = state.locations.find(
    (item) => item.id === locationId && item.campaignId === campaignId,
  )

  if (!location) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Location not found.
      </div>
    )
  }

  function updateName(value: string) {
    appRepository.update('locations', locationId, { name: value })
  }

  function updateDescription(value: string) {
    appRepository.update('locations', locationId, { description: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          to="/campaigns/$campaignId/workspace/locations"
          params={{ campaignId }}
        >
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeftIcon className="size-4" />
            Locations
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <Input
          value={location.name}
          onChange={(event) => updateName(event.target.value)}
          className="max-w-lg text-lg font-semibold"
        />
        <Textarea
          value={location.description}
          onChange={(event) => updateDescription(event.target.value)}
          placeholder="Describe this location"
          className="max-w-2xl"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create the route file**

Create `src/routes/campaigns.$campaignId.workspace.locations.$locationId.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

import LocationDetailPage from '@/features/locations/detail-page'

export const Route = createFileRoute(
  '/campaigns/$campaignId/workspace/locations/$locationId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId, locationId } = Route.useParams()
  return <LocationDetailPage campaignId={campaignId} locationId={locationId} />
}
```

- [ ] **Step 5: Run the test and the dev server route regen**

Run: `pnpm vitest run src/features/locations/__tests__/detail-page.test.tsx`

Expected: PASS (2 tests).

Run: `pnpm tsc --noEmit`

Expected: no errors introduced by the new route. (If a codegen step is needed, the TanStack router plugin will regenerate `routeTree.gen.ts` on next dev-server run — this does not block the unit tests.)

- [ ] **Step 6: Commit**

```bash
git add src/features/locations/detail-page.tsx src/features/locations/__tests__/detail-page.test.tsx src/routes/campaigns.$campaignId.workspace.locations.\$locationId.tsx
git commit -m "feat(locations): add detail route with name and description editing"
```

---

## Task 6: Image upload on the detail page

**Why:** Uploads the map image and stores it as a data URL on `Location.imageUrl`. Uses the Task 2 helper so size/type validation is already centralized.

**Files:**

- Modify: `src/features/locations/detail-page.tsx`
- Modify: `src/features/locations/__tests__/detail-page.test.tsx`

- [ ] **Step 1: Write the failing test (append)**

Append to `src/features/locations/__tests__/detail-page.test.tsx`, inside the `describe('LocationDetailPage'` block:

```tsx
  it('renders an image when Location.imageUrl is set', () => {
    appRepository.update('locations', locationId, {
      imageUrl: 'data:image/png;base64,AAAA',
    })
    const markup = renderToStaticMarkup(
      createElement(LocationDetailPage, { campaignId, locationId }),
    )
    expect(markup).toContain('data:image/png;base64,AAAA')
  })

  it('renders an upload affordance when no image is set', () => {
    const markup = renderToStaticMarkup(
      createElement(LocationDetailPage, { campaignId, locationId }),
    )
    expect(markup).toMatch(/upload image|drop an image/i)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/locations/__tests__/detail-page.test.tsx`

Expected: FAIL — markup does not yet include an image or upload affordance.

- [ ] **Step 3: Add the image area to the detail page**

In `src/features/locations/detail-page.tsx`, insert imports at the top:

```tsx
import { useRef, useState } from 'react'
import { UploadIcon } from 'lucide-react'

import { readFileAsDataUrl } from '@/features/locations/image-intake'
```

Inside the component, before the `return`, add the upload handler:

```tsx
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const result = await readFileAsDataUrl(file)
    if (!result.ok) {
      setUploadError(result.error)
      return
    }

    setUploadError(null)
    appRepository.update('locations', locationId, { imageUrl: result.dataUrl })
  }
```

Replace the return's trailing JSX (after the description Textarea) to include an image area:

```tsx
      {location.imageUrl ? (
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-lg border">
          <img
            src={location.imageUrl}
            alt={location.name}
            className="block w-full"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-2 top-2 gap-2"
          >
            <UploadIcon className="size-4" />
            Replace Image
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-40 w-full max-w-4xl mx-auto flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <UploadIcon className="size-6" />
          Upload Image
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {uploadError ? (
        <p className="text-xs text-destructive">{uploadError}</p>
      ) : null}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/locations/__tests__/detail-page.test.tsx`

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/locations/detail-page.tsx src/features/locations/__tests__/detail-page.test.tsx
git commit -m "feat(locations): upload an image to a location via file picker"
```

---

## Task 7: Pin overlay — render existing pins on the image

**Why:** Before interactivity, make the overlay render correctly. This is the visual foundation for Tasks 8–10.

**Files:**

- Create: `src/features/locations/components/pin-overlay.tsx`
- Modify: `src/features/locations/detail-page.tsx`

- [ ] **Step 1: Implement the overlay**

Create `src/features/locations/components/pin-overlay.tsx`:

```tsx
import type { LocationPin } from '@/features/core/types'

interface PinOverlayProps {
  pins: LocationPin[]
  selectedPinId: string | null
  onSelectPin: (pinId: string | null) => void
}

export function PinOverlay({
  pins,
  selectedPinId,
  onSelectPin,
}: PinOverlayProps) {
  return (
    <div
      className="absolute inset-0"
      onClick={() => onSelectPin(null)}
      role="presentation"
    >
      {pins.map((pin) => (
        <button
          key={pin.id}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelectPin(pin.id)
          }}
          style={{
            left: `${pin.x * 100}%`,
            top: `${pin.y * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
          className={`absolute flex flex-col items-center gap-0.5 ${
            selectedPinId === pin.id ? 'z-10' : 'z-0'
          }`}
          aria-label={`Pin: ${pin.label || 'Unnamed'}`}
        >
          <span
            className={`rounded-full border-2 border-white shadow-md transition-transform ${
              selectedPinId === pin.id
                ? 'size-4 bg-primary'
                : 'size-3 bg-red-500 hover:scale-125'
            }`}
          />
          {pin.label ? (
            <span className="rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow">
              {pin.label}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Wire the overlay into the detail page**

In `src/features/locations/detail-page.tsx`, add the import:

```tsx
import { PinOverlay } from '@/features/locations/components/pin-overlay'
```

Add a `selectedPinId` state near the other state:

```tsx
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
```

Inside the `location.imageUrl` branch, wrap the `<img>` and overlay together:

```tsx
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-lg border">
          <img
            src={location.imageUrl}
            alt={location.name}
            className="block w-full select-none"
            draggable={false}
          />
          <PinOverlay
            pins={location.pins}
            selectedPinId={selectedPinId}
            onSelectPin={setSelectedPinId}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-2 top-2 z-20 gap-2"
          >
            <UploadIcon className="size-4" />
            Replace Image
          </Button>
        </div>
```

- [ ] **Step 3: Add a smoke test for the overlay**

Append to `src/features/locations/__tests__/detail-page.test.tsx`:

```tsx
  it('renders existing pins with their labels', () => {
    appRepository.update('locations', locationId, {
      imageUrl: 'data:image/png;base64,AAAA',
      pins: [
        {
          id: 'pin-1',
          x: 0.3,
          y: 0.4,
          label: 'Town Hall',
          linkedNpcIds: [],
          linkedNotes: [],
        },
      ],
    })
    const markup = renderToStaticMarkup(
      createElement(LocationDetailPage, { campaignId, locationId }),
    )
    expect(markup).toContain('Town Hall')
  })
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/features/locations/__tests__/detail-page.test.tsx`

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/locations/components/pin-overlay.tsx src/features/locations/detail-page.tsx src/features/locations/__tests__/detail-page.test.tsx
git commit -m "feat(locations): render pins as an overlay on the image"
```

---

## Task 8: Click-to-add pin

**Why:** Users need to drop pins. Clicking anywhere on the image (not on an existing pin) adds a new pin at the click location, normalized to 0–1.

**Files:**

- Modify: `src/features/locations/components/pin-overlay.tsx`
- Modify: `src/features/locations/detail-page.tsx`
- Modify: `src/features/locations/__tests__/detail-page.test.tsx`

- [ ] **Step 1: Add `onAddPin` to the overlay and compute normalized coordinates**

In `src/features/locations/components/pin-overlay.tsx`, at the top add:

```tsx
import { toNormalizedCoords } from '@/features/locations/pin-math'
import type { Point } from '@/features/locations/pin-math'
```

Extend the props:

```tsx
interface PinOverlayProps {
  pins: LocationPin[]
  selectedPinId: string | null
  onSelectPin: (pinId: string | null) => void
  onAddPin: (normalized: Point) => void
}
```

Replace the outer `<div>` click handler so that clicking empty space adds a pin:

```tsx
    <div
      className="absolute inset-0"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const point = toNormalizedCoords(
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
          { width: rect.width, height: rect.height },
        )
        onAddPin(point)
      }}
      role="presentation"
    >
```

Keep the `onSelectPin(null)` on a secondary click target — simpler: inside the existing pin buttons, `event.stopPropagation()` prevents the outer handler from firing, so add-pin only fires on empty space. Remove the old `onClick={() => onSelectPin(null)}` — selecting null on background is unnecessary once we add pins there.

- [ ] **Step 2: Wire add-pin into the detail page**

In `src/features/locations/detail-page.tsx`, add the handler:

```tsx
  function handleAddPin(normalized: { x: number; y: number }) {
    const newPin = {
      id: `pin-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`,
      x: normalized.x,
      y: normalized.y,
      label: '',
      linkedNpcIds: [],
      linkedNotes: [],
    }
    appRepository.update('locations', locationId, {
      pins: [...location.pins, newPin],
    })
    setSelectedPinId(newPin.id)
  }
```

Pass it to `<PinOverlay>`:

```tsx
          <PinOverlay
            pins={location.pins}
            selectedPinId={selectedPinId}
            onSelectPin={setSelectedPinId}
            onAddPin={handleAddPin}
          />
```

- [ ] **Step 3: Add a test**

Append to `src/features/locations/__tests__/detail-page.test.tsx`:

```tsx
  it('adds a pin when the image overlay is clicked', async () => {
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react')
    appRepository.update('locations', locationId, {
      imageUrl: 'data:image/png;base64,AAAA',
    })

    try {
      render(createElement(LocationDetailPage, { campaignId, locationId }))

      // The overlay is absolutely positioned. Find it via a role=presentation sibling of the img.
      // Simpler approach: dispatch a click on the role=presentation node.
      const overlay = screen.getAllByRole('presentation').find(
        (el) => el.className.includes('absolute inset-0'),
      )
      if (!overlay) throw new Error('Pin overlay not found')

      // Mock the bounding rect used by the click handler
      Object.defineProperty(overlay, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 400, height: 200, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => ({}) }),
        configurable: true,
      })

      fireEvent.click(overlay, { clientX: 100, clientY: 100 })

      const refreshed = appRepository
        .list('locations')
        .find((l) => l.id === locationId)
      expect(refreshed?.pins.length).toBe(1)
      expect(refreshed?.pins[0]?.x).toBeCloseTo(0.25, 5)
      expect(refreshed?.pins[0]?.y).toBeCloseTo(0.5, 5)
    } finally {
      cleanup()
    }
  })
```

- [ ] **Step 4: Run the test**

Run: `pnpm vitest run src/features/locations/__tests__/detail-page.test.tsx`

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/locations/components/pin-overlay.tsx src/features/locations/detail-page.tsx src/features/locations/__tests__/detail-page.test.tsx
git commit -m "feat(locations): click the image to drop a pin"
```

---

## Task 9: Pin popover — edit label and linked NPCs

**Why:** A pin without a label and linked NPCs is not useful. The popover appears when a pin is selected and lets the user rename the pin, link/unlink NPCs from the campaign, and delete the pin.

**Files:**

- Create: `src/features/locations/components/pin-popover.tsx`
- Modify: `src/features/locations/detail-page.tsx`
- Modify: `src/features/locations/__tests__/detail-page.test.tsx`

- [ ] **Step 1: Implement the popover**

Create `src/features/locations/components/pin-popover.tsx`:

```tsx
import { TrashIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LocationPin, NpcCharacter } from '@/features/core/types'

interface PinPopoverProps {
  pin: LocationPin
  npcs: NpcCharacter[]
  onLabelChange: (value: string) => void
  onToggleNpc: (npcId: string) => void
  onDelete: () => void
  onClose: () => void
}

export function PinPopover({
  pin,
  npcs,
  onLabelChange,
  onToggleNpc,
  onDelete,
  onClose,
}: PinPopoverProps) {
  return (
    <div className="w-72 rounded-md border bg-popover p-3 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <Input
          value={pin.label}
          onChange={(event) => onLabelChange(event.target.value)}
          placeholder="Pin label"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Delete pin"
        >
          <TrashIcon className="size-4 text-destructive" />
        </Button>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Linked NPCs
        </p>
        {npcs.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No NPCs available in this campaign.
          </p>
        ) : (
          <ul className="max-h-40 overflow-y-auto">
            {npcs.map((npc) => {
              const linked = pin.linkedNpcIds.includes(npc.id)
              return (
                <li key={npc.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={linked}
                      onChange={() => onToggleNpc(npc.id)}
                    />
                    <span>{npc.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Render the popover on the detail page when a pin is selected**

In `src/features/locations/detail-page.tsx`, add:

```tsx
import { PinPopover } from '@/features/locations/components/pin-popover'
```

Inside the component, compute helpers:

```tsx
  const selectedPin = selectedPinId
    ? location.pins.find((pin) => pin.id === selectedPinId)
    : null
  const campaignNpcs = state.npcs.filter((npc) => npc.campaignId === campaignId)

  function updatePin(pinId: string, patch: Partial<typeof location.pins[number]>) {
    appRepository.update('locations', locationId, {
      pins: location.pins.map((pin) =>
        pin.id === pinId ? { ...pin, ...patch } : pin,
      ),
    })
  }

  function toggleLinkedNpc(pinId: string, npcId: string) {
    const pin = location.pins.find((p) => p.id === pinId)
    if (!pin) return
    const next = pin.linkedNpcIds.includes(npcId)
      ? pin.linkedNpcIds.filter((id) => id !== npcId)
      : [...pin.linkedNpcIds, npcId]
    updatePin(pinId, { linkedNpcIds: next })
  }

  function deletePin(pinId: string) {
    appRepository.update('locations', locationId, {
      pins: location.pins.filter((pin) => pin.id !== pinId),
    })
    setSelectedPinId(null)
  }
```

Render the popover below the image area:

```tsx
      {selectedPin ? (
        <PinPopover
          pin={selectedPin}
          npcs={campaignNpcs}
          onLabelChange={(value) => updatePin(selectedPin.id, { label: value })}
          onToggleNpc={(npcId) => toggleLinkedNpc(selectedPin.id, npcId)}
          onDelete={() => deletePin(selectedPin.id)}
          onClose={() => setSelectedPinId(null)}
        />
      ) : null}
```

- [ ] **Step 3: Add tests**

Append to `src/features/locations/__tests__/detail-page.test.tsx`:

```tsx
  it('renders the pin popover when a pin is selected', async () => {
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react')
    appRepository.update('locations', locationId, {
      imageUrl: 'data:image/png;base64,AAAA',
      pins: [
        {
          id: 'pin-1',
          x: 0.3,
          y: 0.4,
          label: 'Town Hall',
          linkedNpcIds: [],
          linkedNotes: [],
        },
      ],
    })

    try {
      render(createElement(LocationDetailPage, { campaignId, locationId }))
      fireEvent.click(screen.getByLabelText('Pin: Town Hall'))
      expect(screen.getByRole('button', { name: /delete pin/i })).toBeDefined()
      expect(screen.getByPlaceholderText(/pin label/i)).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('deletes a pin from the popover', async () => {
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react')
    appRepository.update('locations', locationId, {
      imageUrl: 'data:image/png;base64,AAAA',
      pins: [
        {
          id: 'pin-1',
          x: 0.3,
          y: 0.4,
          label: 'Town Hall',
          linkedNpcIds: [],
          linkedNotes: [],
        },
      ],
    })

    try {
      render(createElement(LocationDetailPage, { campaignId, locationId }))
      fireEvent.click(screen.getByLabelText('Pin: Town Hall'))
      fireEvent.click(screen.getByRole('button', { name: /delete pin/i }))

      const refreshed = appRepository
        .list('locations')
        .find((l) => l.id === locationId)
      expect(refreshed?.pins).toEqual([])
    } finally {
      cleanup()
    }
  })
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/features/locations/__tests__/detail-page.test.tsx`

Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/locations/components/pin-popover.tsx src/features/locations/detail-page.tsx src/features/locations/__tests__/detail-page.test.tsx
git commit -m "feat(locations): edit pin label, link NPCs, and delete pins"
```

---

## Task 10: Drag-to-move pins

**Why:** Users will inevitably want to nudge pin positions after initial placement. Native pointer events are sufficient; no drag library needed for this simple case.

**Files:**

- Modify: `src/features/locations/components/pin-overlay.tsx`

- [ ] **Step 1: Add an `onMovePin` prop and pointer-drag logic**

In `src/features/locations/components/pin-overlay.tsx`, extend the props:

```tsx
interface PinOverlayProps {
  pins: LocationPin[]
  selectedPinId: string | null
  onSelectPin: (pinId: string | null) => void
  onAddPin: (normalized: Point) => void
  onMovePin: (pinId: string, normalized: Point) => void
}
```

Inside the component, add a drag state and a ref to the overlay:

```tsx
import { useRef, useState } from 'react'
```

```tsx
  const overlayRef = useRef<HTMLDivElement>(null)
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null)
```

Attach the ref to the outer `<div>` and update the outer click handler to ignore clicks at the end of a drag:

```tsx
    <div
      ref={overlayRef}
      className="absolute inset-0"
      onClick={(event) => {
        if (draggingPinId) {
          // Suppress the click that concludes a drag
          setDraggingPinId(null)
          return
        }
        const rect = event.currentTarget.getBoundingClientRect()
        const point = toNormalizedCoords(
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
          { width: rect.width, height: rect.height },
        )
        onAddPin(point)
      }}
      role="presentation"
    >
```

Add a shared pointer-move handler on each pin button:

```tsx
      {pins.map((pin) => (
        <button
          key={pin.id}
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation()
            ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
            setDraggingPinId(pin.id)
          }}
          onPointerMove={(event) => {
            if (draggingPinId !== pin.id) return
            const overlay = overlayRef.current
            if (!overlay) return
            const rect = overlay.getBoundingClientRect()
            const point = toNormalizedCoords(
              { x: event.clientX - rect.left, y: event.clientY - rect.top },
              { width: rect.width, height: rect.height },
            )
            onMovePin(pin.id, point)
          }}
          onPointerUp={(event) => {
            ;(event.target as HTMLElement).releasePointerCapture(event.pointerId)
            // Don't clear draggingPinId here — the bubbled click on the overlay clears it.
          }}
          onClick={(event) => {
            event.stopPropagation()
            if (!draggingPinId) onSelectPin(pin.id)
          }}
          style={{
            left: `${pin.x * 100}%`,
            top: `${pin.y * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
          className={`absolute flex flex-col items-center gap-0.5 touch-none ${
            selectedPinId === pin.id ? 'z-10' : 'z-0'
          }`}
          aria-label={`Pin: ${pin.label || 'Unnamed'}`}
        >
```

- [ ] **Step 2: Wire the new prop into the detail page**

In `src/features/locations/detail-page.tsx`, pass a `onMovePin` handler to the overlay:

```tsx
          <PinOverlay
            pins={location.pins}
            selectedPinId={selectedPinId}
            onSelectPin={setSelectedPinId}
            onAddPin={handleAddPin}
            onMovePin={(pinId, point) =>
              updatePin(pinId, { x: point.x, y: point.y })
            }
          />
```

- [ ] **Step 3: Run the existing test suite**

Run: `pnpm vitest run src/features/locations`

Expected: all existing locations tests still PASS. Drag behavior is covered by manual verification (pointer events are hard to unit-test reliably in jsdom).

- [ ] **Step 4: Commit**

```bash
git add src/features/locations/components/pin-overlay.tsx src/features/locations/detail-page.tsx
git commit -m "feat(locations): drag pins to reposition them"
```

---

## Task 11: Delete the whole location from the detail page

**Why:** Round-trip CRUD is complete. A location the user no longer wants must be removable without digging into a database console.

**Files:**

- Modify: `src/features/locations/detail-page.tsx`
- Modify: `src/features/locations/__tests__/detail-page.test.tsx`

- [ ] **Step 1: Write the failing test (append)**

Append to `src/features/locations/__tests__/detail-page.test.tsx`:

```tsx
  it('deletes the whole location when the delete action is confirmed', async () => {
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react')
    try {
      render(createElement(LocationDetailPage, { campaignId, locationId }))
      fireEvent.click(screen.getByRole('button', { name: /delete location/i }))
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }))

      const remaining = appRepository.list('locations').find((l) => l.id === locationId)
      expect(remaining).toBeUndefined()
    } finally {
      cleanup()
    }
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/locations/__tests__/detail-page.test.tsx -t "deletes the whole location"`

Expected: FAIL — button not found.

- [ ] **Step 3: Add the delete affordance**

In `src/features/locations/detail-page.tsx`, add to the top-row JSX (next to the back-link Button):

```tsx
        <div className="ml-auto flex items-center gap-2">
          {confirmDelete ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  appRepository.delete('locations', locationId)
                }}
              >
                Confirm Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Location
            </Button>
          )}
        </div>
```

Add the state near the other state:

```tsx
  const [confirmDelete, setConfirmDelete] = useState(false)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/locations/__tests__/detail-page.test.tsx`

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/locations/detail-page.tsx src/features/locations/__tests__/detail-page.test.tsx
git commit -m "feat(locations): delete a location from its detail page"
```

---

## Task 12: Swap the workspace Locations route to use the new page

**Why:** The Locations tab in the workspace nav currently renders the parked hex map builder via the old delegation. Swap it to the new page.

**Files:**

- Modify: `src/routes/campaigns.$campaignId.workspace.locations.tsx`
- Remove: `src/features/session-workspace/locations-page.tsx`

- [ ] **Step 1: Point the route at the new list page**

Replace the contents of `src/routes/campaigns.$campaignId.workspace.locations.tsx` with:

```tsx
import { createFileRoute } from '@tanstack/react-router'

import LocationsListPage from '@/features/locations/list-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/locations')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <LocationsListPage campaignId={campaignId} />
}
```

- [ ] **Step 2: Remove the old delegation file**

Run: `rm src/features/session-workspace/locations-page.tsx`

- [ ] **Step 3: Verify nothing else imports the old file**

Run: `grep -rn "from '@/features/session-workspace/locations-page'" src`

Expected: no matches.

If any matches appear, edit the referencing file to import from `@/features/locations/list-page` or remove the reference.

- [ ] **Step 4: Run all tests**

Run: `pnpm vitest run`

Expected: no regressions relative to the previous baseline (locations tests green; no new failures).

- [ ] **Step 5: Commit**

```bash
git add src/routes/campaigns.$campaignId.workspace.locations.tsx src/features/session-workspace/locations-page.tsx
git commit -m "feat(locations): route workspace Locations tab to new list page"
```

---

## Task 13: Final verification — build, tests, manual smoke

**Why:** Confirm the whole feature works end-to-end in the browser, especially the interactive pieces that unit tests cannot fully cover (drag, image upload).

**Files:**

- No code changes.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 2: Run the type checker**

Run: `pnpm tsc --noEmit`

Expected: no new errors relative to the baseline documented after Phase 1.

- [ ] **Step 3: Run the production build**

Run: `pnpm build`

Expected: successful build.

- [ ] **Step 4: Manual smoke**

Run: `pnpm dev`

In the browser:

1. Open a campaign → workspace → Locations tab.
2. Create a new location named "Greenhollow."
3. Click into the detail page, edit the name and description.
4. Upload an image (<2 MB). Verify it renders.
5. Click several locations on the image to drop pins.
6. Click a pin; edit its label; link an NPC (if any exist in the campaign).
7. Drag a pin; release; verify the position persists after refresh.
8. Delete a pin; delete the location; verify the list reflects both.
9. Refresh the page; verify all state survives.

- [ ] **Step 5: If any smoke step fails**

Open a new task at the bottom of this plan for the specific failure and fix it before considering Phase 2 complete.

---

## Appendix: What comes next

**Phase 3 (Run vertical):** `session-detail-page.tsx` refactor (1,125 → <400 lines), DM screen polish, initiative tracker polish, Session Log UI (the unified notes stream that replaces `DmNote` / `StoryPin` / `TimelineEvent` in the MVP), and an end-to-end integration smoke test that walks the full Prep → Run loop.
