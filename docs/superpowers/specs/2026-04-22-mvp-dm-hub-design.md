# MVP Design — DM Hub: 5e Prep + Run

**Date:** 2026-04-22
**Status:** Draft (pending user review)
**Scope:** First shippable version of the dnd-db-app — a single-user, local-first Dungeon Master tool for D&D 5e.

---

## 1. Product Statement

A single-user, local-first D&D 5e tool that supports a DM through **Prep** (campaign, worldbuilding-lite, NPCs, encounters, sessions) and **Run** (at-the-table session experience). **D&D Beyond character import** is the signature feature. The MVP has no backend, no authentication, and no multiplayer, but its data shapes are designed so a future sync/multiplayer layer can be added without a migration storm.

## 2. Goals and Non-Goals

### Goals

- Ship one 5e-focused workflow polished end to end.
- Deliver a clear "Prep → Run" loop that the DM can use for a full mock session without falling back to external tools.
- Preserve all parked feature code in the repo without breaking the build.
- Keep data models multi-tenant- and sync-friendly for future expansion.

### Non-Goals

- No backend, cloud sync, authentication, or sharing with players.
- No real-time or multiplayer features.
- No Pathfinder 2e, Call of Cthulhu 7e, or Cyberpunk Red UI (enum stays; UI gates on `rpgSystem === 'dnd-5e'`).
- No Figma-style `new-map-builder` in the main flow.
- No AI chat (`campaign-chat`) in the main flow.
- No mobile optimization beyond "does not break on tablet" (desktop-first).

## 3. Target User (MVP)

One DM (the author) running a hypothetical 5e campaign locally. Future personas (public DMs, DM + players at the table) are explicitly out of scope but informed architectural decisions (multi-tenant-shaped data, import/export).

## 4. Core User Loop

```text
Create campaign → Import PCs (DDB) → Add NPCs → Build locations (image + pins)
  → Prep an encounter → Start session → Run initiative / HP / dice / lookup → End session
```

Every screen in MVP must lead forward to the next natural step in this loop. MVP success means every arrow in that sequence works and feels good.

## 5. Scope Matrix

### IN for MVP (polish to shippable)

1. **Campaigns** — CRUD and active-campaign selection.
2. **Player Characters + D&D Beyond import** — import service already exists; MVP wires it into the PC flow, polishes edge cases, and adds refresh.
3. **NPC characters** — CRUD, quick-attach to sessions.
4. **Encounter library** — CRUD with a monster picker; encounters can be linked to a session.
5. **Worldbuilding-lite (Locations)** — list of locations per campaign, each optionally has an image with pinned points of interest. The Figma hex builder is deferred.
6. **Sessions + DM screen** — initiative tracker, HP/conditions, inline rules lookup, scratch notes, dice roller integration.
7. **Dice roller** — keep the existing animated dice box.
8. **5e rules lookup** — keep existing content; expose as a side panel in the DM screen.
9. **Unified home/dashboard** — surfaces the active campaign and a "Start Session" CTA.
10. **Session Log (unified notes)** — one note stream per campaign that replaces the separate notes/pins/secrets/scene-notes features for MVP.

### PARKED for v2 (code kept, nav hidden)

- `new-map-builder` (Figma-like hex/terrain painter).
- `campaign-chat` (Ollama AI integration).
- Separate `story-pins`, `timeline`, `scene-notes`, `secrets` features (collapsed into Session Log for MVP; existing storage kept read-compatible).
- Pathfinder 2e / Call of Cthulhu 7e / Cyberpunk Red UI.
- Multi-user, auth, sync, sharing, real-time.

## 6. Information Architecture

```text
/                             Home: active-campaign dashboard + Start Session CTA
/campaigns                    Campaign list
/campaigns/:id                Campaign overview
  /workspace
    /sessions                 Session list
    /sessions/:id             Session detail (DM screen)
    /player-characters        PC roster (+ DDB import)
    /player-characters/:id    PC detail
    /npcs                     NPC list
    /encounters               Encounter library
    /locations                Locations (image + pins worldbuilding)
    /log                      Session log (unified notes)
/rpgs                         Kept; gated to 5e-only content
```

Routes outside this set (`/maps`, `/new-map-builder`, `/campaign-chat`, top-level `story-pins`, separate `secrets`/`scene-notes`) are removed from all navigation (sidebar, home shortcuts, cross-links). The route files themselves remain in the repo so direct URL access still works, but nothing in the MVP UI links to them.

## 7. Data Model Changes

Starting point: `src/features/core/types.ts` already covers most of this.

### Keep as-is

- `Campaign`, `PlayerCharacter` + sheet types, `NpcCharacter`, `LookupEntry`, `AppState`, `Repository`, `StorageAdapter`.

### Add

- `SessionLogEntry`: `{ id, campaignId, sessionId?, kind: 'note' | 'event' | 'secret', title, body, timestamp, tags? }` — replaces the MVP role of `DmNote` / `StoryPin` / `TimelineEvent`.
- `Location`: `{ id, campaignId, name, description, imageUrl?, pins: LocationPin[] }`.
- `LocationPin`: `{ id, x, y, label, linkedNpcIds: EntityId[], linkedNotes: EntityId[] }`. `x` and `y` are normalized (0–1) coordinates relative to the image.
- Optional sync-scaffolding field on `BaseEntity`: `syncMeta?: { dirty: boolean; lastSyncedAt: string | null }` — unused in MVP but future-proofs against a migration storm.

### Realign

- `Encounter`: ensure shape includes `{ status: 'planned' | 'active' | 'completed', linkedSessionId?: EntityId, monsters: MonsterRef[] }`. Existing encounter-library code should be audited and aligned.
- `Session`: state machine `draft → running → finished`, plus a `dmScreenState` blob for initiative/HP. Leverage the existing `session-board-store` and `session-types.ts` work.

### Backward-compat

- `DmNote`, `StoryPin`, `TimelineEvent` collections remain in storage. MVP stops writing new entries into them and treats them as read-only if present. A later migration can merge them into `SessionLogEntry`.

## 8. Component Boundaries

Each module below owns one responsibility, has a well-defined interface with the rest of the app, and should be understandable without reading sibling modules.

- `features/core` — persistence + repository (unchanged).
- `features/campaigns` — campaign CRUD + active-campaign selection.
- `features/player-characters` — DDB import service + PC CRUD. Already cleanly split into `server/*` and state; preserve that split.
- `features/session-workspace` — the Run experience and MVP's highest-complexity area. Keep the existing focused modules (`session-initiative-tracker`, `session-dm-party-panel`, `session-npc-roster`, `session-extras-panel`, `monster-picker`). **Refactor target:** `session-detail-page.tsx` must drop from 1,125 lines to under 400 by moving logic into the sub-modules; the page file orchestrates only.
- `features/locations` (new, small) — list view + image-pin viewer/editor.
- `features/session-log` (new, small) — unified note stream.
- `features/dice-roller`, `features/dnd-lookup`, `features/encounter-library` — unchanged logic; polish UI only.

## 9. Persistence and Future-Proofing

- Remain on localStorage via the existing `Repository` interface.
- `createdAt`, `updatedAt`, and `campaignId` on every entity keep the data multi-tenant-shaped.
- `syncMeta` scaffolding on `BaseEntity` is added in MVP and unused, so a later sync layer does not need a heavy migration.
- Add JSON export/import of the entire `AppState` — cheap to implement, and it directly supports portfolio demos and cross-machine moves.

## 10. Signature Feature: D&D Beyond Character Import

Current state: `src/features/player-characters/server/` already contains `import-service.ts`, `import-player-character.ts`, and `refresh-player-character.ts`, and the `PlayerCharacter` + `PlayerCharacterSheet` types match the D&D Beyond JSON shape (see `sample-dnd.json`). The user confirmed the import is functional.

### MVP expectations

- Import flow is the primary path to create a PC in MVP. Manual entry remains as a fallback for NPCs and for PCs when import fails.
- Clear import states surfaced in the UI: `ready`, `syncing`, `error` with a human-readable message.
- A "refresh" action on each imported PC to re-pull the latest sheet.
- Errors must not break the list; the PC stays visible with a retry button.

### Known risks

- The underlying endpoint is unofficial; structural drift is the biggest threat. Isolate parsing in one module so changes are localized.
- Network and CORS constraints depend on how the import runs today. Any environmental prerequisites must be documented with the feature.

## 11. Success Criteria

1. The DM can create a campaign, import 3–4 PCs from D&D Beyond, add 5 NPCs, build 2 locations with pins, prep an encounter, and run a full mock session using only this app.
2. The Start Session → Initiative → End Session loop is smooth enough to prefer it over paper/Discord.
3. The app loads the active campaign in under 1 second on localhost and survives a full page reload with state intact.
4. `session-detail-page.tsx` is under 400 lines after refactor.
5. All parked features (`new-map-builder`, `campaign-chat`, etc.) remain in the repo without breaking `pnpm build` or `pnpm test`.

## 12. Testing Strategy

- Extend existing unit coverage:
  - `player-characters/__tests__/import-service.test.ts` — error paths and refresh.
  - `core/__tests__/migrations.test.ts` — migrations that add `Location` and `SessionLogEntry`.
  - `core/__tests__/player-characters-repository.test.ts` — unchanged.
- Add repository tests for the new `Location` and `SessionLogEntry` collections.
- Add one integration-level smoke test that walks the core loop end to end (create campaign → add PC → add NPC → create location → create encounter → start session → tick initiative → end session).
- No end-to-end (browser) framework is introduced for MVP.

## 13. Out-of-Scope Features (Explicit List)

| Feature | Disposition |
| --- | --- |
| `new-map-builder` (Figma hex painter) | Parked; code kept; removed from nav |
| `campaign-chat` (Ollama) | Parked; code kept; removed from nav |
| `story-pins` (standalone) | Collapsed into Session Log for MVP |
| `dm-notepad` (standalone) | Collapsed into Session Log for MVP |
| `scene-notes` / `secrets` (standalone) | Collapsed into Session Log for MVP |
| Pathfinder 2e / CoC 7e / Cyberpunk Red UI | Enum retained; UI gated to 5e-only |
| Multiplayer / auth / sync | Post-MVP; data shapes future-proofed |
| Mobile-specific UX | Desktop-first; must not break on tablet |

## 14. Open Questions

- Does any non-5e content in the existing codebase (e.g., rpg-library Cyberpunk/PF stubs) already route users into dead ends that need cleanup during MVP?
- Are any existing tests tied to the soon-to-be-collapsed features (`story-pins`, `dm-notepad`, `scene-notes`, `secrets`) that will need to be deleted or adjusted?
- Does the DDB import today work purely client-side, or does it rely on a dev-server proxy? Documentation of the prerequisite is a small but important MVP task.
