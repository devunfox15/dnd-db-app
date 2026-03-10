# D&D Beyond Capture Helper Design

**Goal**

Replace the JSON file import/refresh workflow with an in-app paste-response helper that guides the user to copy the D&D Beyond character API response from DevTools and paste it directly into the app.

**Problem**

Private or campaign-shared D&D Beyond characters cannot be fetched reliably from the app server because the server does not have the user’s logged-in browser session. File uploads work, but they add unnecessary friction when the user already has the response body available in DevTools.

**Approach**

Add a reusable D&D Beyond capture helper UI that appears:

- on the player character import page for first-time import
- on the player detail page for refresh

The helper will:

- explain exactly which request to capture
- accept pasted raw response JSON in a textarea
- validate the response shape
- normalize the payload through the existing D&D Beyond mapper
- either create/update a player sheet on import or refresh the current sheet on detail view

**User Flow**

On the import page:

1. Open the D&D Beyond character page while logged in.
2. Open DevTools Network.
3. Reload and find the request matching `/{characterId}?includeCustomItems=true`.
4. Copy the response body.
5. Paste it into the helper textarea and import.

On the detail page:

1. Repeat the same capture process for the current character.
2. Paste the fresh response body into the helper.
3. The app validates that the pasted character ID matches the current sheet before refreshing.

**Architecture**

Keep one normalization path:

- raw response text
- JSON parse
- D&D Beyond response validation
- `mapDndBeyondCharacter(...)`

Build one reusable helper component used by both pages. The pages own the final action:

- import page: create or merge by `dndBeyondCharacterId`
- detail page: refresh current record only, rejecting mismatched IDs

**Data Handling**

The stored player-character model continues to keep:

- `dndBeyondCharacterId`
- `importSource`
- `sourceUrl`
- `lastSyncedAt`

The previous `json-upload` source should be retired in favor of a capture/paste source. Existing migrated records can remain functional by treating non-URL imports as manual capture-backed records.

**Validation Rules**

- pasted text must be valid JSON
- payload must contain a D&D Beyond response with `data.id` and `data.name`
- detail refresh must reject a pasted payload whose `data.id` differs from the current sheet’s `dndBeyondCharacterId`

**UI Design**

The helper should be compact and practical:

- short instructions block
- request pattern shown in monospace
- textarea for pasted response
- action button
- inline validation or refresh/import error state

The existing public URL import should remain available separately for public characters.

**Testing**

- parser tests for pasted response text
- import-page behavior test for create/update by character ID
- detail-page behavior test for rejecting mismatched character IDs
- build verification

**Non-Goals**

- automated browser auth
- server-side D&D Beyond session handling
- DOM scraping of the rendered character page
