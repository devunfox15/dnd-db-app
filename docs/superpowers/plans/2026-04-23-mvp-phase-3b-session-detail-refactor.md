# MVP Phase 3b — session-detail-page Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink `session-workspace/session-detail-page.tsx` from 1,125 lines to under 400 by extracting focused submodules (plan cards, add forms, collapsible panel, planner view) into sibling files. Zero behavior change; refactor only.

**Architecture:** Four new sibling files colocated under `features/session-workspace/`. The main page keeps its responsibility — read session state, orchestrate tabs, delegate to `PlannerView` (new) or `DmScreenPage` (existing). The extracted submodules own card rendering, form input, and the planner-tab body. All persistence still goes through `useCampaignStorageState` as today.

**Tech Stack:** React 19, TypeScript, `@dnd-kit/react` (drag-and-drop already in use), Tailwind + shadcn/ui, Vitest. No new dependencies.

**Spec reference:** [docs/superpowers/specs/2026-04-22-mvp-dm-hub-design.md](../specs/2026-04-22-mvp-dm-hub-design.md) §8 (Component Boundaries) and §11 success criterion #4 ("`session-detail-page.tsx` under 400 lines").

**Out of scope for Phase 3b:**

- Any behavior change. This is structural only. If a bug is discovered during extraction, file it for Phase 3c (DM screen + initiative polish).
- Consolidating `session-types.ts` (already in good shape — don't touch).
- DM screen polish or initiative tracker polish (→ 3c).
- Walk-the-loop integration smoke test (→ 3d).

---

## File Structure

**New files (all under `src/features/session-workspace/`):**

- `session-plan-cards.tsx` — exports `SceneCard`, `EncounterCard`, `SecretCard`, `RewardCard`, `HookCard`, `SortableItem`, and the `arrayMove` helper.
- `session-plan-forms.tsx` — exports `AddSceneForm`, `AddEncounterForm`, `AddSecretForm`, `AddRewardForm`, `AddHookForm`, and the `DND_SKILLS` constant.
- `collapsible-panel.tsx` — exports `CollapsiblePanel`.
- `session-planner-view.tsx` — exports the `SessionPlannerView` component (the planner tab content).

**Modified file:**

- `session-detail-page.tsx` — shrinks to <400 lines by importing from the new files above and delegating rendering.

**New test file:**

- `__tests__/session-detail-page.test.tsx` — smoke test that asserts the page renders without crashing and surfaces key text (session title, tabs). This is the refactor's safety net.

### Responsibility map

| File | Responsibility |
| --- | --- |
| `session-plan-cards.tsx` | Render a single plan item in read-only + drag-handle form. No mutations. |
| `session-plan-forms.tsx` | Collect input for creating a single plan item. Calls `onAdd(item)` / `onCancel()` — no persistence. |
| `collapsible-panel.tsx` | Generic collapsible shell with title + icon + badge. No session knowledge. |
| `session-planner-view.tsx` | Owns the DnD kit wiring, plan-items list rendering, add-form state machine, and right-column collapsible panels for Roster + Party. Takes `{ campaignId, sessionId }`. |
| `session-detail-page.tsx` | Load session record, render header + tab row, delegate to `SessionPlannerView` or `DmScreenPage`. |

### Imports discipline

- `session-plan-forms.tsx` imports `SessionPlanItem` and related block types from `session-types.ts` (no changes).
- `session-plan-cards.tsx` imports block types from `session-types.ts`.
- `session-planner-view.tsx` imports cards + forms + collapsible panel.
- `session-detail-page.tsx` imports only `SessionPlannerView`, `DmScreenPage`, and core session state.
- No circular imports; each file depends only on files earlier in this list.

---

## Task 1: Add a smoke test for session-detail-page before refactoring

**Why:** Refactors are safer with a trip wire. A minimal render test will catch regressions in the tab switch, session resolution, and delegation without requiring the full DnD-kit dance.

**Files:**

- Create: `src/features/session-workspace/__tests__/session-detail-page.test.tsx`

- [ ] **Step 1: Write the test**

Create `src/features/session-workspace/__tests__/session-detail-page.test.tsx`:

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createElement } from 'react'

import { createEmptyState } from '@/features/core/migrations'
import { resetRepositoryStateForTests } from '@/features/core/repository'
import SessionDetailPage from '@/features/session-workspace/session-detail-page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}))

// DM screen and the DnD-powered planner lean on browser APIs; we just want
// the page shell to mount and delegate, so we stub the heavy children.
vi.mock('@/features/session-workspace/dm-screen-page', () => ({
  default: () => <div data-testid="dm-screen-stub">dm screen</div>,
}))
vi.mock('@/features/session-workspace/monster-picker', () => ({
  default: () => null,
}))
vi.mock('@/features/session-workspace/session-npc-roster', () => ({
  default: () => null,
}))
vi.mock('@/features/session-workspace/session-party-panel', () => ({
  default: () => null,
}))

const campaignId = 'campaign-1'
const sessionId = 'session-1'

function seedCampaign() {
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

  const sessionsKey = `dnd-campaign-storage:${campaignId}:sessions`
  window.localStorage.setItem(
    sessionsKey,
    JSON.stringify({
      sessions: [
        {
          id: sessionId,
          title: 'The Broken Anvil',
          description: '',
          sessionNumber: 1,
          createdAt: now,
        },
      ],
    }),
  )
}

describe('SessionDetailPage', () => {
  beforeEach(() => {
    seedCampaign()
  })

  it('renders the session title and the planner + dm-screen tab labels', () => {
    try {
      render(createElement(SessionDetailPage, { campaignId, sessionId }))
      expect(screen.getByText('The Broken Anvil')).toBeDefined()
      expect(screen.getByText('Planner')).toBeDefined()
      expect(screen.getByText('DM Screen')).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('renders not-found when the session id is unknown', () => {
    try {
      render(
        createElement(SessionDetailPage, { campaignId, sessionId: 'missing' }),
      )
      expect(screen.getByText(/session not found/i)).toBeDefined()
    } finally {
      cleanup()
    }
  })
})
```

- [ ] **Step 2: Update vitest config to include session-workspace in jsdom env**

Edit `vitest.config.ts`. Change the `environmentMatchGlobs` line to also include session-workspace:

```ts
      environmentMatchGlobs: [
        ['**/session-log/**/*.{test,spec}.{ts,tsx}', 'jsdom'],
        ['**/session-workspace/__tests__/session-detail-page.test.{ts,tsx}', 'jsdom'],
      ],
```

- [ ] **Step 3: Verify the localStorage key pattern matches the real code**

Run: `grep -n "dnd-campaign-storage\|STORAGE_KEY" src/features/session-workspace/storage.ts | head -5`

The exact key prefix used by `useCampaignStorageState` must match what the test writes. If the real key is different, update the test's `sessionsKey` to match.

- [ ] **Step 4: Run the test**

Run: `pnpm vitest run src/features/session-workspace/__tests__/session-detail-page.test.tsx`

Expected: PASS (2 tests). If the localStorage key mismatch causes the "not found" branch to fire on the happy-path test, fix the key in the test to match `storage.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/features/session-workspace/__tests__/session-detail-page.test.tsx vitest.config.ts
git commit -m "test(session-workspace): add smoke test for SessionDetailPage"
```

---

## Task 2: Extract `CollapsiblePanel`

**Why:** Smallest, most isolated submodule — good warm-up. Shakes out any copy-paste or circular-import issues before touching bigger units.

**Files:**

- Create: `src/features/session-workspace/collapsible-panel.tsx`
- Modify: `src/features/session-workspace/session-detail-page.tsx`

- [ ] **Step 1: Copy the `CollapsiblePanel` function (lines 761–795 of the current file) verbatim into the new module**

Create `src/features/session-workspace/collapsible-panel.tsx`:

```tsx
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CollapsiblePanelProps {
  title: string
  icon: LucideIcon
  badge?: number
  children: React.ReactNode
}

export function CollapsiblePanel({
  title,
  icon: Icon,
  badge,
  children,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/50"
      >
        <Icon className="size-4 text-muted-foreground" />
        <span>{title}</span>
        {typeof badge === 'number' ? (
          <span className="ml-auto rounded-md border bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
            {badge}
          </span>
        ) : null}
        <ChevronDown
          className={`ml-${typeof badge === 'number' ? '2' : 'auto'} size-4 text-muted-foreground transition-transform ${
            open ? '' : '-rotate-90'
          }`}
        />
      </button>
      {open ? <div className="border-t">{children}</div> : null}
    </div>
  )
}
```

Before pasting, open `session-detail-page.tsx` lines 761–795 and confirm the actual shape of the existing `CollapsiblePanel`. If it differs from the code above, use the existing implementation verbatim rather than the approximation above.

- [ ] **Step 2: Replace the inline `CollapsiblePanel` in `session-detail-page.tsx` with an import**

In `session-detail-page.tsx`:

- Delete the inline `CollapsiblePanel` function (lines ~761–795).
- Add the import near the other session-workspace imports:

```tsx
import { CollapsiblePanel } from '@/features/session-workspace/collapsible-panel'
```

- [ ] **Step 3: Run the smoke test + full suite**

Run: `pnpm vitest run`

Expected: 111+ passed. Specifically, the Task 1 smoke test still passes.

- [ ] **Step 4: Commit**

```bash
git add src/features/session-workspace/collapsible-panel.tsx src/features/session-workspace/session-detail-page.tsx
git commit -m "refactor(session-workspace): extract CollapsiblePanel"
```

---

## Task 3: Extract plan card components

**Why:** Cards are pure presentational components with no state — the safest extraction. Moving them out clears ~250 lines from the main page.

**Files:**

- Create: `src/features/session-workspace/session-plan-cards.tsx`
- Modify: `src/features/session-workspace/session-detail-page.tsx`

- [ ] **Step 1: Create `session-plan-cards.tsx`**

Create `src/features/session-workspace/session-plan-cards.tsx`. Copy the following blocks from `session-detail-page.tsx` verbatim, in this order:

1. The `arrayMove` helper (lines 87–91).
2. `SceneCard` (lines 95–135).
3. `EncounterCard` (lines 137–189).
4. `SecretCard` (lines 191–241).
5. `RewardCard` (lines 243–300).
6. `HookCard` (lines 302–349).
7. `SortableItem` (lines 351–369).

At the top of the new file, add the imports the cards/helpers depend on:

```tsx
import { GripVertical, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/react/sortable'

import { Button } from '@/components/ui/button'
import type {
  EncounterBlock,
  HookBlock,
  RewardBlock,
  SceneBlock,
  SecretBlock,
} from '@/features/session-workspace/session-types'
```

Prefix each copied function with `export` so they can be imported elsewhere:

```tsx
export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  // ... verbatim body
}

export function SceneCard(/* verbatim signature */) { /* verbatim body */ }
export function EncounterCard(/* verbatim signature */) { /* verbatim body */ }
export function SecretCard(/* verbatim signature */) { /* verbatim body */ }
export function RewardCard(/* verbatim signature */) { /* verbatim body */ }
export function HookCard(/* verbatim signature */) { /* verbatim body */ }
export function SortableItem(/* verbatim signature */) { /* verbatim body */ }
```

**Do not** rewrite any logic — copy exactly what exists today. The goal is zero behavior change.

- [ ] **Step 2: Delete the extracted code from `session-detail-page.tsx`**

In `session-detail-page.tsx`:

- Delete lines that previously contained `arrayMove`, `SceneCard`, `EncounterCard`, `SecretCard`, `RewardCard`, `HookCard`, `SortableItem`.
- Remove the lucide imports that are now unused (`GripVertical`, `Trash2`) and any other imports only used by the moved code. Leave imports that are still used by the main page.
- Add the import for the new module:

```tsx
import {
  arrayMove,
  EncounterCard,
  HookCard,
  RewardCard,
  SceneCard,
  SecretCard,
  SortableItem,
} from '@/features/session-workspace/session-plan-cards'
```

- [ ] **Step 3: Type check**

Run: `pnpm tsc --noEmit`

Expected: no new errors.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run`

Expected: all tests still pass. If a test fails citing a missing import or undefined symbol, double-check that the extracted functions are prefixed with `export` and that the main page's import names match.

- [ ] **Step 5: Commit**

```bash
git add src/features/session-workspace/session-plan-cards.tsx src/features/session-workspace/session-detail-page.tsx
git commit -m "refactor(session-workspace): extract plan card components"
```

---

## Task 4: Extract add-form components

**Why:** Five forms with a consistent `{ onAdd, onCancel }` shape — cohesive group worth living in one file. Removes another ~380 lines.

**Files:**

- Create: `src/features/session-workspace/session-plan-forms.tsx`
- Modify: `src/features/session-workspace/session-detail-page.tsx`

- [ ] **Step 1: Create `session-plan-forms.tsx`**

Create `src/features/session-workspace/session-plan-forms.tsx`. Copy the following from `session-detail-page.tsx`:

1. The `DND_SKILLS` constant (lines 66–85).
2. `AddSceneForm` (lines 371–415).
3. `AddEncounterForm` (lines 417–545).
4. `AddSecretForm` (lines 547–630).
5. `AddRewardForm` (lines 632–703).
6. `AddHookForm` (lines 705–759).

At the top of the new file, add the imports these forms rely on:

```tsx
import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MonsterPicker from '@/features/session-workspace/monster-picker'
import type {
  EncounterBlock,
  HookBlock,
  RewardBlock,
  SceneBlock,
  SecretBlock,
  SessionPlanItem,
} from '@/features/session-workspace/session-types'
```

Before copying, scan the actual imports used by each form in the existing file (e.g. `Plus`, `Input`, `MonsterPicker`, etc.) and include only the ones actually referenced inside the form bodies. Adjust the import block to match what the copied code actually uses.

Export each form:

```tsx
export const DND_SKILLS = [/* verbatim */]

export function AddSceneForm(/* verbatim */) { /* verbatim */ }
export function AddEncounterForm(/* verbatim */) { /* verbatim */ }
export function AddSecretForm(/* verbatim */) { /* verbatim */ }
export function AddRewardForm(/* verbatim */) { /* verbatim */ }
export function AddHookForm(/* verbatim */) { /* verbatim */ }
```

- [ ] **Step 2: Delete extracted code from `session-detail-page.tsx`**

- Delete the `DND_SKILLS` constant.
- Delete the five `Add…Form` functions.
- Remove imports that are now unused (e.g., `Input`, `Textarea`, `Plus`, `MonsterPicker` if the main page no longer references them). Keep any still used by the main page.
- Add the imports for the new module:

```tsx
import {
  AddEncounterForm,
  AddHookForm,
  AddRewardForm,
  AddSceneForm,
  AddSecretForm,
} from '@/features/session-workspace/session-plan-forms'
```

- [ ] **Step 3: Run tests + type check**

Run: `pnpm vitest run && pnpm tsc --noEmit`

Expected: no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/features/session-workspace/session-plan-forms.tsx src/features/session-workspace/session-detail-page.tsx
git commit -m "refactor(session-workspace): extract plan add-forms"
```

---

## Task 5: Extract `SessionPlannerView`

**Why:** The planner-tab JSX inside the main page is the last big chunk (~220 lines of that 328-line component body). Extracting it makes the main page a thin orchestrator.

**Files:**

- Create: `src/features/session-workspace/session-planner-view.tsx`
- Modify: `src/features/session-workspace/session-detail-page.tsx`

- [ ] **Step 1: Create `session-planner-view.tsx`**

Create `src/features/session-workspace/session-planner-view.tsx`. The new component takes the same state surface as the main page currently does, owns the planner-tab rendering, and calls into cards/forms/panel. Signature:

```tsx
import { useMemo, useState } from 'react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortableOperation } from '@dnd-kit/react/sortable'
import {
  EyeOff,
  Gift,
  Link2,
  Plus,
  ScrollText,
  Swords,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCollection } from '@/features/core/store'
import { CollapsiblePanel } from '@/features/session-workspace/collapsible-panel'
import {
  arrayMove,
  EncounterCard,
  HookCard,
  RewardCard,
  SceneCard,
  SecretCard,
  SortableItem,
} from '@/features/session-workspace/session-plan-cards'
import {
  AddEncounterForm,
  AddHookForm,
  AddRewardForm,
  AddSceneForm,
  AddSecretForm,
} from '@/features/session-workspace/session-plan-forms'
import SessionNpcRoster from '@/features/session-workspace/session-npc-roster'
import SessionPartyPanel from '@/features/session-workspace/session-party-panel'
import { useCampaignStorageState } from '@/features/session-workspace/storage'
import type {
  SessionNpcRosterState,
  SessionPlanItem,
  SessionPlanState,
} from '@/features/session-workspace/session-types'

type AddingKind = 'scene' | 'encounter' | 'secret' | 'reward' | 'hook' | null

interface SessionPlannerViewProps {
  campaignId: string
  sessionId: string
}

export function SessionPlannerView({
  campaignId,
  sessionId,
}: SessionPlannerViewProps) {
  // Move the planner-specific state + handlers here:
  //   plan (useCampaignStorageState)
  //   npcRoster (useCampaignStorageState)
  //   players (useCollection)
  //   addingKind, activeId (useState)
  //   addItem, deleteItem, activeItem
  //
  // Return the JSX that currently lives under the `activeTab === 'planner'`
  // branch in session-detail-page.tsx — that full left-column/right-column
  // grid, the DragDropProvider, the action buttons, the sortable list, the
  // inline add forms, and the right-column CollapsiblePanels.
  //
  // This extraction is mechanical: copy the planner JSX and its surrounding
  // state hooks verbatim. No behavior change.
}
```

Perform the extraction by:

1. Copy the `addItem`, `deleteItem`, `activeItem` definitions.
2. Copy the hooks (`useCampaignStorageState<SessionPlanState>`, `useCampaignStorageState<SessionNpcRosterState>`, `useCollection('playerCharacters', ...)`, `useState` for `addingKind` and `activeId`).
3. Copy the planner-tab JSX block (lines 899–1118 in the current file — the full `activeTab === 'planner' && (…)` expression, but without the surrounding `activeTab === 'planner' &&` guard).

The fully-inlined view component ends up at roughly 220 lines.

- [ ] **Step 2: Rewire `session-detail-page.tsx` to use `SessionPlannerView`**

In `session-detail-page.tsx`:

- Delete the planner state hooks (`plan`, `npcRoster`, `players`, `activeId`, `addingKind`, `addItem`, `deleteItem`, `activeItem`).
- Delete the planner JSX block (`activeTab === 'planner' && (…)`).
- Replace with:

```tsx
        {activeTab === 'planner' && (
          <SessionPlannerView campaignId={campaignId} sessionId={sessionId} />
        )}
```

- Add the import:

```tsx
import { SessionPlannerView } from '@/features/session-workspace/session-planner-view'
```

- Clean up imports no longer used by the main page: `DragDropProvider`, `DragOverlay`, `isSortableOperation`, card components, add-form components, `CollapsiblePanel` (if only the planner used it), `useCollection`, `useCampaignStorageState` for `SessionPlanState`/`SessionNpcRosterState`, most lucide icons tied to plan items (`EyeOff`, `Gift`, `Link2`, `Plus`, `ScrollText`, `Swords`, `Users`). Keep imports still used by the header/tab/back-link code (`ArrowLeft`, `Monitor`, `ScrollText` — only if still referenced by the tab label).

- [ ] **Step 3: Run tests + type check**

Run: `pnpm vitest run && pnpm tsc --noEmit`

Expected: no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/features/session-workspace/session-planner-view.tsx src/features/session-workspace/session-detail-page.tsx
git commit -m "refactor(session-workspace): extract SessionPlannerView from detail page"
```

---

## Task 6: Verify `session-detail-page.tsx` is under 400 lines

**Why:** The refactor's primary success criterion. Also a sanity check that imports were cleaned up along the way.

**Files:** None.

- [ ] **Step 1: Measure**

Run: `wc -l src/features/session-workspace/session-detail-page.tsx`

Expected: under 400.

- [ ] **Step 2: If the count is ≥ 400, identify what to trim**

- Look for inlined helpers or side structures that could move to `session-plan-cards.tsx` or `session-planner-view.tsx`.
- Look for stale imports.
- If the `Session` / `SessionsState` local types or the `tabs` constant can move to `session-types.ts` cleanly (no new coupling), do so.

If a further extraction is needed, open one additional task at the bottom of this plan describing exactly what will move and run that before the final verification step.

- [ ] **Step 3: Measure the other extracted files too**

Run: `wc -l src/features/session-workspace/{session-detail-page,session-planner-view,session-plan-cards,session-plan-forms,collapsible-panel}.tsx`

Expected rough counts after refactor: detail-page < 400, planner-view ~220, plan-cards ~260, plan-forms ~400, collapsible-panel ~40. Exact numbers depend on verbatim source.

- [ ] **Step 4: Commit if trimming was required**

If Task 6 Step 2 required additional edits, commit them:

```bash
git add -A
git commit -m "refactor(session-workspace): trim remaining lines from detail page"
```

If no trimming was required, skip the commit.

---

## Task 7: Final verification

**Why:** End-to-end confirmation that the refactor preserved behavior and the file sizes hit target.

**Files:** None.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`

Expected: all tests pass (109 from the prior baseline + 2 new from Task 1 = 111).

- [ ] **Step 2: Run the type checker**

Run: `pnpm tsc --noEmit`

Expected: no new errors relative to the post-Phase-3a baseline.

- [ ] **Step 3: Run the production build**

Run: `pnpm build`

Expected: successful build.

- [ ] **Step 4: Manual smoke**

Run: `pnpm dev`

In the browser:

1. Open a campaign → Sessions → open a session.
2. Confirm the Planner tab renders the header, action buttons, and any existing plan items.
3. Add a Scene, an Encounter, a Secret, a Reward, and a Hook. Reorder them via drag. Delete one of them. Confirm persistence survives a page refresh.
4. Switch to the DM Screen tab. Confirm it still renders (the exact DM-screen behavior is out of scope — we only care that it mounts).
5. Open the right-column NPC Roster and Party panels; confirm they collapse/expand.

- [ ] **Step 5: If any smoke step fails**

Open a new task at the bottom of this plan describing the observed behavior, fix it, and re-run Steps 1–4 before declaring Phase 3b complete.

---

## Appendix: What comes next

**Phase 3c:** DM screen + initiative tracker polish. The refactor in 3b gives us a clean orchestrator to grow into for those improvements.

**Phase 3d:** Prep → Run integration smoke test walking the full MVP loop (create campaign → import PC → add NPC → prep encounter → start session → tick initiative → log a Session Log entry → end session).
