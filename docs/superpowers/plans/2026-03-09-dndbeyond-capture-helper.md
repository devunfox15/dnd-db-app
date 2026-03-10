# D&D Beyond Capture Helper Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace JSON file-based manual import and refresh with a paste-response D&D Beyond capture helper on both the player import page and the player detail page.

**Architecture:** Centralize raw response parsing into one player-character import helper and use one reusable UI component for instructions, textarea input, and submission. Import and refresh pages keep their existing record-merge semantics while delegating parsing and validation to shared code.

**Tech Stack:** React, TypeScript, TanStack Start, Vitest

---

### Task 1: Add failing parser and state tests

**Files:**
- Modify: `src/features/player-characters/__tests__/import-service.test.ts`
- Modify: `src/features/player-characters/__tests__/state.test.ts`

- [ ] Step 1: Add a failing test for parsing a pasted raw D&D Beyond response body into an imported character.
- [ ] Step 2: Add a failing test for rejecting invalid pasted response text.
- [ ] Step 3: Run `npm test -- src/features/player-characters/__tests__/import-service.test.ts src/features/player-characters/__tests__/state.test.ts`.
- [ ] Step 4: Verify the failures are caused by missing paste-response support.

### Task 2: Implement shared pasted-response parsing

**Files:**
- Modify: `src/features/player-characters/types.ts`
- Modify: `src/features/player-characters/server/import-service.ts`
- Modify: `src/features/player-characters/state.ts`
- Modify: `src/features/core/types.ts`
- Modify: `src/features/core/migrations.ts`

- [ ] Step 1: Add or rename import-source metadata to represent manual capture/paste imports.
- [ ] Step 2: Implement a parser that accepts raw pasted response text, validates the D&D Beyond response shape, and maps it through the existing normalizer.
- [ ] Step 3: Remove file-name-specific assumptions from import metadata and migrations.
- [ ] Step 4: Run `npm test -- src/features/player-characters/__tests__/import-service.test.ts src/features/player-characters/__tests__/state.test.ts`.
- [ ] Step 5: Verify all parser and state tests pass.

### Task 3: Build reusable capture helper UI

**Files:**
- Create: `src/features/player-characters/components/dndbeyond-capture-helper.tsx`

- [ ] Step 1: Write the component with instruction copy, request pattern guidance, textarea input, and submit button.
- [ ] Step 2: Expose a callback-based API so pages can decide whether the parsed character creates, merges, or refreshes.
- [ ] Step 3: Keep error display local to the helper and allow parent pages to pass loading state and contextual labels.

### Task 4: Integrate helper into the import page

**Files:**
- Modify: `src/features/session-workspace/player-page.tsx`
- Modify: `src/features/session-workspace/__tests__/player-page.test.tsx`

- [ ] Step 1: Add a failing test covering capture-helper rendering on the import page if practical.
- [ ] Step 2: Replace the manual file-upload UI with the shared paste-response helper.
- [ ] Step 3: Keep the public URL import flow intact.
- [ ] Step 4: Preserve create-or-merge behavior by `dndBeyondCharacterId`.
- [ ] Step 5: Run `npm test -- src/features/session-workspace/__tests__/player-page.test.tsx`.

### Task 5: Integrate helper into the detail page refresh flow

**Files:**
- Modify: `src/features/session-workspace/player-detail-page.tsx`
- Add or modify tests if present for the detail page behavior

- [ ] Step 1: Add a failing test for rejecting pasted response text when the character ID does not match the current sheet, if practical.
- [ ] Step 2: Replace upload-backed refresh UI with the shared capture helper for non-public/manual refresh.
- [ ] Step 3: Keep server-side refresh for public URL imports.
- [ ] Step 4: Ensure the helper refreshes only the current record on success.

### Task 6: Verification

**Files:**
- Review all touched files

- [ ] Step 1: Run `npm test -- src/features/player-characters src/features/session-workspace/__tests__/player-page.test.tsx src/features/core/__tests__/player-characters-repository.test.ts`.
- [ ] Step 2: Run `npm run build`.
- [ ] Step 3: Review final UI copy for the request capture instructions.
