# SOP: Integrating the 5e API into the Dungeon Master Dashboard

## Purpose
This SOP standardizes how to use the 5e API (https://www.dnd5eapi.co) inside the DM Dashboard so game prep and live-session lookups are reliable and fast.

## Scope
Applies to:
- API-powered search (monsters, spells, classes, equipment)
- Encounter prep lookups
- Note enrichment workflows

## API Reference
Primary documentation:
- https://5e-bits.github.io/docs/introduction

Primary base URL used by the app:
- `https://www.dnd5eapi.co/api`

## Required Capabilities
1. Search supported resource categories.
2. Show a filtered list by name query.
3. Fetch and render detail payload for selected item.
4. Allow copy/paste into DM notes or future auto-linking.

## Workflow
1. User selects resource category (`monsters`, `spells`, `classes`, `equipment`).
2. App requests index endpoint (`GET /api/{resource}`).
3. App filters `results[]` by case-insensitive query.
4. User selects one result.
5. App requests detail endpoint (`GET /api/{resource}/{index}`).
6. App renders normalized JSON payload in detail panel.

## Reliability and Performance Standards
- Timeouts: use a client timeout strategy if adding a backend proxy.
- Rate limiting: debounce search inputs if implementing live search.
- Caching: cache last query per resource in local storage/session storage.
- Graceful fallback: render a useful message on API failure.

## Error Handling Standards
- Network/API failure: display "Failed to fetch 5e API."
- Empty results: display "No matching results."
- Malformed payload: log to console and show "Unexpected response format."

## Security and Compliance
- No authentication is required for the public 5e API.
- Do not store sensitive tokens in local storage for production environments.
- If AI enrichment is added server-side, keep secrets on the server only.

## QA Checklist
- [ ] Can query each supported resource type.
- [ ] Results list is filtered by user input.
- [ ] Clicking a result displays full details.
- [ ] API errors are user-visible.
- [ ] Empty query still returns top list items.

## Change Management
When changing API usage:
1. Update this SOP.
2. Update README feature docs.
3. Validate with manual browser test.
4. Record improvements in roadmap/backlog.
