# MVP Phase 3a — Session Log UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Session Log feature end-to-end — a unified, campaign-scoped note stream built on the `SessionLogEntry` data model added in Phase 1. Supports three kinds of entries (note, event, secret) and absorbs places, scene descriptions, session recaps, and other free-text prep/run material that was previously scattered across `DmNote`, `StoryPin`, `TimelineEvent`, `scene-notes`, and `secrets`.

**Architecture:** A small `features/session-log/` module with a list page and an inline editor. All persistence goes through the existing generic `appRepository.create|update|delete('sessionLog', ...)`. A new workspace tab (`/campaigns/:id/workspace/log`) replaces the nav slot left empty by the Locations removal.

**Tech Stack:** React 19, TypeScript, TanStack Router (file-based routes), Tailwind v4 + shadcn/ui, Vitest + @testing-library/react. No new dependencies.

**Spec reference:** [docs/superpowers/specs/2026-04-22-mvp-dm-hub-design.md](../specs/2026-04-22-mvp-dm-hub-design.md) §5.9, §7 (SessionLogEntry type), §8 (features/session-log).

**Out of scope for Phase 3a:**

- `session-detail-page.tsx` refactor — Phase 3b.
- DM screen polish / initiative tracker polish — Phase 3c.
- Migration of existing `DmNote` / `StoryPin` / `TimelineEvent` rows into `SessionLogEntry` — those remain readable via their own pages if accessed directly, but the MVP UI no longer surfaces them. A later migration pass (post-MVP) can merge them.
- Real-time search, tags-based filtering, attachments — noted as open questions for v2.

---

## File Structure

**New files:**

- `src/features/session-log/list-page.tsx` — list view + create form.
- `src/features/session-log/entry-form.tsx` — inline editor used both for create and edit flows.
- `src/features/session-log/entry-card.tsx` — read + edit-in-place per entry.
- `src/features/session-log/kind-filter.tsx` — segmented control for "All / Notes / Events / Secrets".
- `src/features/session-log/__tests__/list-page.test.tsx`
- `src/features/session-log/__tests__/entry-card.test.tsx`
- `src/features/session-log/__tests__/kind-filter.test.tsx`
- `src/routes/campaigns.$campaignId.workspace.log.tsx` — new workspace route.

**Modified files:**

- `src/routes/campaigns.$campaignId.workspace.tsx` — add "Session Log" tab to `workspaceLinks`.

---

## Task 1: Kind filter (segmented control)

**Why:** The list needs a way to narrow by kind. Extracting it keeps the list page focused on data + layout. A stateless component makes it trivially testable.

**Files:**

- Create: `src/features/session-log/kind-filter.tsx`
- Create: `src/features/session-log/__tests__/kind-filter.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/session-log/__tests__/kind-filter.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { createElement } from 'react'

import { KindFilter } from '@/features/session-log/kind-filter'

describe('KindFilter', () => {
  it('renders All, Notes, Events, Secrets buttons', () => {
    try {
      render(createElement(KindFilter, { value: 'all', onChange: () => {} }))
      expect(screen.getByRole('button', { name: /all/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /^notes$/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /events/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /secrets/i })).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('calls onChange with the clicked kind', () => {
    const spy = vi.fn()
    try {
      render(createElement(KindFilter, { value: 'all', onChange: spy }))
      fireEvent.click(screen.getByRole('button', { name: /events/i }))
      expect(spy).toHaveBeenCalledWith('event')
    } finally {
      cleanup()
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/session-log/__tests__/kind-filter.test.tsx`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the filter**

Create `src/features/session-log/kind-filter.tsx`:

```tsx
import type { SessionLogKind } from '@/features/core/types'

export type KindFilterValue = 'all' | SessionLogKind

interface KindFilterProps {
  value: KindFilterValue
  onChange: (value: KindFilterValue) => void
}

const options: { value: KindFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'event', label: 'Events' },
  { value: 'secret', label: 'Secrets' },
]

export function KindFilter({ value, onChange }: KindFilterProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-card p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/session-log/__tests__/kind-filter.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/session-log/kind-filter.tsx src/features/session-log/__tests__/kind-filter.test.tsx
git commit -m "feat(session-log): add kind filter segmented control"
```

---

## Task 2: Entry form (create + edit)

**Why:** One form reused for both flows. Keeps the list page thin and means any later changes to the shape happen in one place.

**Files:**

- Create: `src/features/session-log/entry-form.tsx`

- [ ] **Step 1: Implement the form**

Create `src/features/session-log/entry-form.tsx`:

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SessionLogKind } from '@/features/core/types'

export interface EntryDraft {
  kind: SessionLogKind
  title: string
  body: string
}

interface EntryFormProps {
  draft: EntryDraft
  onChange: (draft: EntryDraft) => void
  onSubmit: () => void
  onCancel?: () => void
  submitLabel: string
}

const kindOptions: { value: SessionLogKind; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'event', label: 'Event' },
  { value: 'secret', label: 'Secret' },
]

export function EntryForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: EntryFormProps) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={draft.kind}
          onChange={(event) =>
            onChange({ ...draft, kind: event.target.value as SessionLogKind })
          }
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          {kindOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Input
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          placeholder="Title"
          className="flex-1 min-w-[12rem]"
        />
      </div>
      <Textarea
        value={draft.body}
        onChange={(event) => onChange({ ...draft, body: event.target.value })}
        placeholder="Body — describe the scene, event, secret, or place"
        rows={4}
      />
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!draft.title.trim() && !draft.body.trim()}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`

Expected: no new errors relative to baseline.

- [ ] **Step 3: Commit**

```bash
git add src/features/session-log/entry-form.tsx
git commit -m "feat(session-log): add shared entry form for create and edit"
```

---

## Task 3: Entry card (read + edit-in-place)

**Why:** Each entry is either displayed read-only or in-place edit. Inline editing avoids a modal for the common "fix a typo" flow.

**Files:**

- Create: `src/features/session-log/entry-card.tsx`
- Create: `src/features/session-log/__tests__/entry-card.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/session-log/__tests__/entry-card.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { createElement } from 'react'

import { EntryCard } from '@/features/session-log/entry-card'
import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'
import type { SessionLogEntry } from '@/features/core/types'

const campaignId = 'campaign-1'

function seedEntry(): SessionLogEntry {
  resetRepositoryStateForTests(createEmptyState())
  const created = appRepository.create('sessionLog', {
    campaignId,
    kind: 'note',
    title: 'Opening Scene',
    body: 'Party arrives at Greenhollow',
    timestamp: new Date().toISOString(),
  })
  return created
}

describe('EntryCard', () => {
  let entry: SessionLogEntry = null as unknown as SessionLogEntry

  beforeEach(() => {
    entry = seedEntry()
  })

  it('renders the entry title, body, and kind badge', () => {
    try {
      render(createElement(EntryCard, { entry }))
      expect(screen.getByText('Opening Scene')).toBeDefined()
      expect(screen.getByText('Party arrives at Greenhollow')).toBeDefined()
      expect(screen.getByText(/note/i)).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('enters edit mode when Edit is clicked and saves via the repository', () => {
    try {
      render(createElement(EntryCard, { entry }))
      fireEvent.click(screen.getByRole('button', { name: /edit/i }))

      const titleInput = screen.getByPlaceholderText(/title/i) as HTMLInputElement
      fireEvent.change(titleInput, { target: { value: 'Revised Title' } })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      const refreshed = appRepository
        .list('sessionLog')
        .find((item) => item.id === entry.id)
      expect(refreshed?.title).toBe('Revised Title')
    } finally {
      cleanup()
    }
  })

  it('deletes the entry via the repository when Delete is confirmed', () => {
    try {
      render(createElement(EntryCard, { entry }))
      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }))

      const remaining = appRepository
        .list('sessionLog')
        .find((item) => item.id === entry.id)
      expect(remaining).toBeUndefined()
    } finally {
      cleanup()
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/session-log/__tests__/entry-card.test.tsx`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the card**

Create `src/features/session-log/entry-card.tsx`:

```tsx
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { appRepository } from '@/features/core/store'
import type { SessionLogEntry, SessionLogKind } from '@/features/core/types'
import {
  EntryForm,
  type EntryDraft,
} from '@/features/session-log/entry-form'

const kindLabel: Record<SessionLogKind, string> = {
  note: 'Note',
  event: 'Event',
  secret: 'Secret',
}

const kindBadgeClass: Record<SessionLogKind, string> = {
  note: 'bg-muted text-muted-foreground',
  event: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100',
  secret: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
}

interface EntryCardProps {
  entry: SessionLogEntry
}

export function EntryCard({ entry }: EntryCardProps) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draft, setDraft] = useState<EntryDraft>({
    kind: entry.kind,
    title: entry.title,
    body: entry.body,
  })

  function save() {
    appRepository.update('sessionLog', entry.id, {
      kind: draft.kind,
      title: draft.title,
      body: draft.body,
    })
    setEditing(false)
  }

  function cancel() {
    setDraft({ kind: entry.kind, title: entry.title, body: entry.body })
    setEditing(false)
  }

  function remove() {
    appRepository.delete('sessionLog', entry.id)
  }

  if (editing) {
    return (
      <EntryForm
        draft={draft}
        onChange={setDraft}
        onSubmit={save}
        onCancel={cancel}
        submitLabel="Save"
      />
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${kindBadgeClass[entry.kind]}`}
            >
              {kindLabel[entry.kind]}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
          <CardTitle className="text-base">{entry.title || 'Untitled'}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {confirmDelete ? (
            <>
              <Button size="sm" variant="destructive" onClick={remove}>
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
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
        {entry.body}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/session-log/__tests__/entry-card.test.tsx`

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/session-log/entry-card.tsx src/features/session-log/__tests__/entry-card.test.tsx
git commit -m "feat(session-log): add entry card with edit-in-place and delete"
```

---

## Task 4: List page — read existing entries and filter by kind

**Why:** Start with read-only + filter; add the create form in the next task. Keeps the commit self-contained and tests incremental.

**Files:**

- Create: `src/features/session-log/list-page.tsx`
- Create: `src/features/session-log/__tests__/list-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/session-log/__tests__/list-page.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { createElement } from 'react'

import SessionLogListPage from '@/features/session-log/list-page'
import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}))

const campaignId = 'campaign-1'

function seedBase() {
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
}

describe('SessionLogListPage', () => {
  beforeEach(() => {
    seedBase()
  })

  it('renders an empty state when no entries exist', () => {
    try {
      render(createElement(SessionLogListPage, { campaignId }))
      expect(screen.getByText(/no log entries/i)).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('renders all entries by default and filters by kind', () => {
    appRepository.create('sessionLog', {
      campaignId,
      kind: 'note',
      title: 'Greenhollow',
      body: 'Frontier town',
      timestamp: new Date().toISOString(),
    })
    appRepository.create('sessionLog', {
      campaignId,
      kind: 'secret',
      title: 'Buried gold',
      body: 'Under the chapel',
      timestamp: new Date().toISOString(),
    })

    try {
      render(createElement(SessionLogListPage, { campaignId }))
      expect(screen.getByText('Greenhollow')).toBeDefined()
      expect(screen.getByText('Buried gold')).toBeDefined()

      fireEvent.click(screen.getByRole('button', { name: /secrets/i }))
      expect(screen.queryByText('Greenhollow')).toBeNull()
      expect(screen.getByText('Buried gold')).toBeDefined()
    } finally {
      cleanup()
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/session-log/__tests__/list-page.test.tsx`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the list page**

Create `src/features/session-log/list-page.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { NotebookPenIcon } from 'lucide-react'

import { useAppState } from '@/features/core/store'
import { EntryCard } from '@/features/session-log/entry-card'
import {
  KindFilter,
  type KindFilterValue,
} from '@/features/session-log/kind-filter'

interface SessionLogListPageProps {
  campaignId: string
}

export default function SessionLogListPage({ campaignId }: SessionLogListPageProps) {
  const state = useAppState()
  const [filter, setFilter] = useState<KindFilterValue>('all')

  const entries = useMemo(() => {
    const scoped = state.sessionLog.filter((entry) => entry.campaignId === campaignId)
    const filtered = filter === 'all' ? scoped : scoped.filter((entry) => entry.kind === filter)
    return [...filtered].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }, [campaignId, filter, state.sessionLog])

  return (
    <div className="space-y-4">
      <KindFilter value={filter} onChange={setFilter} />

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <NotebookPenIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No log entries yet. Add a note, event, secret, or place description
            to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/session-log/__tests__/list-page.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/session-log/list-page.tsx src/features/session-log/__tests__/list-page.test.tsx
git commit -m "feat(session-log): add list page with kind filter"
```

---

## Task 5: Inline create form on the list page

**Why:** Users need to add entries without jumping to a separate page. An inline form collapsible at the top of the list is the simplest UX.

**Files:**

- Modify: `src/features/session-log/list-page.tsx`
- Modify: `src/features/session-log/__tests__/list-page.test.tsx`

- [ ] **Step 1: Write the failing test (append)**

Append to `src/features/session-log/__tests__/list-page.test.tsx`, inside the `describe('SessionLogListPage'` block:

```tsx
  it('creates an entry via the inline form', () => {
    try {
      render(createElement(SessionLogListPage, { campaignId }))

      // Open the inline create form
      fireEvent.click(screen.getByRole('button', { name: /new entry/i }))

      const titleInput = screen.getByPlaceholderText(/title/i) as HTMLInputElement
      fireEvent.change(titleInput, { target: { value: 'Session Recap' } })

      fireEvent.click(screen.getByRole('button', { name: /^add$/i }))

      const created = appRepository
        .list('sessionLog')
        .find((entry) => entry.title === 'Session Recap')
      expect(created).toBeDefined()
      expect(created?.campaignId).toBe(campaignId)
      expect(created?.kind).toBe('note')
    } finally {
      cleanup()
    }
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/features/session-log/__tests__/list-page.test.tsx -t "creates an entry"`

Expected: FAIL — "New Entry" button not found.

- [ ] **Step 3: Add the inline form**

Replace the body of `src/features/session-log/list-page.tsx` with:

```tsx
import { useMemo, useState } from 'react'
import { NotebookPenIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { appRepository, useAppState } from '@/features/core/store'
import { EntryCard } from '@/features/session-log/entry-card'
import {
  EntryForm,
  type EntryDraft,
} from '@/features/session-log/entry-form'
import {
  KindFilter,
  type KindFilterValue,
} from '@/features/session-log/kind-filter'

interface SessionLogListPageProps {
  campaignId: string
}

const emptyDraft: EntryDraft = { kind: 'note', title: '', body: '' }

export default function SessionLogListPage({ campaignId }: SessionLogListPageProps) {
  const state = useAppState()
  const [filter, setFilter] = useState<KindFilterValue>('all')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<EntryDraft>(emptyDraft)

  const entries = useMemo(() => {
    const scoped = state.sessionLog.filter((entry) => entry.campaignId === campaignId)
    const filtered = filter === 'all' ? scoped : scoped.filter((entry) => entry.kind === filter)
    return [...filtered].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }, [campaignId, filter, state.sessionLog])

  function submitNew() {
    const trimmedTitle = draft.title.trim()
    const trimmedBody = draft.body.trim()
    if (!trimmedTitle && !trimmedBody) return

    appRepository.create('sessionLog', {
      campaignId,
      kind: draft.kind,
      title: trimmedTitle,
      body: trimmedBody,
      timestamp: new Date().toISOString(),
    })
    setDraft(emptyDraft)
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <KindFilter value={filter} onChange={setFilter} />
        {!creating ? (
          <Button size="sm" onClick={() => setCreating(true)} className="gap-2">
            <PlusIcon className="size-4" />
            New Entry
          </Button>
        ) : null}
      </div>

      {creating ? (
        <EntryForm
          draft={draft}
          onChange={setDraft}
          onSubmit={submitNew}
          onCancel={() => {
            setCreating(false)
            setDraft(emptyDraft)
          }}
          submitLabel="Add"
        />
      ) : null}

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <NotebookPenIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No log entries yet. Add a note, event, secret, or place description
            to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/features/session-log/__tests__/list-page.test.tsx`

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/session-log/list-page.tsx src/features/session-log/__tests__/list-page.test.tsx
git commit -m "feat(session-log): add inline create form on list page"
```

---

## Task 6: Route file

**Why:** Surface the list page at `/campaigns/:id/workspace/log` so the new workspace tab (Task 7) can link to it.

**Files:**

- Create: `src/routes/campaigns.$campaignId.workspace.log.tsx`

- [ ] **Step 1: Create the route**

Create `src/routes/campaigns.$campaignId.workspace.log.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

import SessionLogListPage from '@/features/session-log/list-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/log')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <SessionLogListPage campaignId={campaignId} />
}
```

- [ ] **Step 2: Verify the build picks up the new route**

Run: `pnpm tsc --noEmit`

Expected: no new errors. (The TanStack router plugin regenerates `routeTree.gen.ts` on the next dev-server run or build; that regeneration is not required for unit tests.)

Run: `pnpm build`

Expected: successful build; `routeTree.gen.ts` gets updated to include the new route.

- [ ] **Step 3: Commit**

```bash
git add src/routes/campaigns.\$campaignId.workspace.log.tsx src/routeTree.gen.ts
git commit -m "feat(session-log): add workspace Log route"
```

---

## Task 7: Add "Session Log" tab to the workspace nav

**Why:** Makes the feature discoverable. Slots into the nav bar where Locations used to live.

**Files:**

- Modify: `src/routes/campaigns.$campaignId.workspace.tsx`
- Modify: `src/routes/__tests__/-campaign-workspace-route.test.tsx`

- [ ] **Step 1: Write the failing test (append)**

Append to the first `describe('campaign workspace route shell'` it-block in `src/routes/__tests__/-campaign-workspace-route.test.tsx`:

```tsx
    expect(markup).toContain('Session Log')
```

Place it just before the final `expect(markup).toContain('shrink-0')` line, so the existing assertions stay intact.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/routes/__tests__/-campaign-workspace-route.test.tsx`

Expected: FAIL — markup does not contain "Session Log".

- [ ] **Step 3: Add the tab to `workspaceLinks`**

Edit `src/routes/campaigns.$campaignId.workspace.tsx`.

Update the Lucide import:

```tsx
import {
  CalendarDays,
  NotebookPen,
  Users,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
```

Append a new entry to `workspaceLinks`:

```tsx
  {
    label: 'Session Log',
    to: '/campaigns/$campaignId/workspace/log',
    icon: NotebookPen,
    segment: 'log',
  },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/routes/__tests__/-campaign-workspace-route.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/campaigns.\$campaignId.workspace.tsx src/routes/__tests__/-campaign-workspace-route.test.tsx
git commit -m "feat(session-log): add Session Log tab to workspace nav"
```

---

## Task 8: Final verification

**Why:** Confirm the whole feature works end-to-end in the browser, especially the UX that unit tests don't fully cover (filter switching, create → edit → delete flow, empty-to-populated transition).

**Files:** None.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 2: Run the type checker**

Run: `pnpm tsc --noEmit`

Expected: no new errors relative to the post-Locations-removal baseline.

- [ ] **Step 3: Run the production build**

Run: `pnpm build`

Expected: successful build.

- [ ] **Step 4: Manual smoke**

Run: `pnpm dev`

In the browser:

1. Open a campaign → workspace → Session Log tab.
2. Verify the empty state renders.
3. Click "New Entry," create a note, an event, and a secret (different titles so they're distinguishable).
4. Filter by Notes / Events / Secrets; verify the list narrows correctly.
5. Edit one entry inline, change the title, Save. Confirm the card updates.
6. Delete an entry via Confirm Delete.
7. Refresh the page; verify all remaining state survives.

- [ ] **Step 5: If any smoke step fails**

Open a new task at the bottom of this plan for the specific failure and fix it before considering Phase 3a complete.

---

## Appendix: What comes next

**Phase 3b:** `session-detail-page.tsx` refactor (1,125 → <400 lines). Pure restructure; no new user-facing features.

**Phase 3c:** DM screen + initiative tracker polish. Depends on 3b being done.

**Phase 3d:** Prep → Run integration smoke test that walks the full MVP loop end-to-end (create campaign → import PC → add NPC → prep encounter → start session → tick initiative → log a Session Log entry → end session).
