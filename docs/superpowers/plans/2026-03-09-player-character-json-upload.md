# Player Character JSON Upload Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `.json` upload import and refresh for D&D Beyond player characters, updating the same workspace sheet when the uploaded payload matches the existing character ID.

**Architecture:** Keep the existing D&D Beyond mapper as the single normalization path. Add client-side JSON parsing helpers and lightweight import metadata on stored player characters so the UI can distinguish public URL imports from upload-backed imports when rendering refresh actions and validation.

**Tech Stack:** React, TypeScript, Vitest, TanStack Start, local repository state

---

### Task 1: Add failing tests for JSON payload parsing and upload metadata

**Files:**
- Modify: `src/features/player-characters/__tests__/import-service.test.ts`
- Modify: `src/features/player-characters/__tests__/state.test.ts`

- [ ] Step 1: Write a failing test for parsing valid `pc-{character}##.json` uploads.
- [ ] Step 2: Run `npm test -- src/features/player-characters/__tests__/import-service.test.ts` and verify it fails for missing upload support.
- [ ] Step 3: Write a failing test for persisted uploaded imports keeping upload metadata through create/merge helpers.
- [ ] Step 4: Run `npm test -- src/features/player-characters/__tests__/state.test.ts` and verify it fails for missing metadata support.

### Task 2: Implement client-side JSON upload normalization

**Files:**
- Modify: `src/features/player-characters/types.ts`
- Modify: `src/features/player-characters/server/import-service.ts`
- Modify: `src/features/player-characters/state.ts`

- [ ] Step 1: Add types for upload-backed imports and optional stored metadata.
- [ ] Step 2: Implement a helper that parses raw JSON text, validates the filename pattern, and maps the payload through the existing D&D Beyond normalizer.
- [ ] Step 3: Update create/merge helpers so upload metadata persists and public URL imports keep their existing behavior.
- [ ] Step 4: Run `npm test -- src/features/player-characters/__tests__/import-service.test.ts src/features/player-characters/__tests__/state.test.ts` and verify the new tests pass.

### Task 3: Add upload UI and upload-backed refresh behavior

**Files:**
- Modify: `src/features/session-workspace/player-page.tsx`
- Modify: `src/features/session-workspace/player-detail-page.tsx`
- Modify: `src/features/core/types.ts`

- [ ] Step 1: Write a failing UI test or focused state-level test if needed for upload-backed refresh messaging.
- [ ] Step 2: Add file input support for `.json` uploads on the player page and route uploaded files through the new parser.
- [ ] Step 3: Update list/detail refresh controls so upload-backed characters prompt for a fresh `.json` instead of calling the server refresh action.
- [ ] Step 4: Show the expected filename convention `pc-{character}##.json` in the UI and validation errors.
- [ ] Step 5: Run the relevant tests and confirm both public URL and upload-backed flows still work.

### Task 4: Final verification

**Files:**
- Modify: `src/features/session-workspace/__tests__/player-page.test.tsx` if needed

- [ ] Step 1: Run `npm test -- src/features/player-characters src/features/session-workspace/__tests__/player-page.test.tsx`.
- [ ] Step 2: Review the changed files for type consistency and UI copy.

