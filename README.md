# DM Dashboard (React + TypeScript + Vite SPA)

This project is now migrated to a **React + TypeScript + Vite** single-page application using **npm**.

## What changed

- Migrated from plain HTML/CSS/JS to Vite React TS.
- Added SPA-oriented structure with:
  - `src/pages`
  - `src/components`
  - `src/App.tsx`
  - `src/app-shell.js` (bridge/metadata file kept per your request)
- Preserved key features:
  - floating multi-dice roller with center dice arena animation
  - linked notes with `[[Wiki Links]]`
  - 5e API lookup
  - right sidebar AI chat + NPC generator
  - accent color customization

## File structure

- `index.html` – Vite entry HTML
- `src/main.tsx` – React bootstrap
- `src/App.tsx` – app root component
- `src/app-shell.js` – requested app.js bridge/metadata
- `src/pages/DashboardPage.tsx` – page-level composition/state
- `src/components/*` – UI components
- `src/lib/dice.ts` – dice helpers/constants
- `src/styles.css` – global styles
- `docs/ENV_REGISTRY_RESTRICTIONS.md` – setup for restricted npm registries

## Run with npm

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## AI NPC Generation

The NPC generator in the right sidebar now supports AI-enhanced output and always returns:
- name
- brief description
- alignment
- job
- D&D 5e roll stats (STR/DEX/CON/INT/WIS/CHA with score + modifier)

### Environment variables

Add these to a local `.env` file (or your shell):

```bash
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_MODEL=gpt-4o-mini
```

- `VITE_OPENAI_API_KEY` enables AI generation.
- `VITE_OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`.

If no API key is configured, or if the AI request fails, the app automatically uses a deterministic local fallback generator.

### Security note

This project uses a browser-side API key for development speed. Do not use long-lived production secrets in client-side code; use a server-side proxy for production deployments.

## If your environment blocks npm registry access

1. Configure registry variables and token.
2. Copy `.npmrc.example` to `.npmrc`.
3. Run registry diagnostics.

```bash
cp .npmrc.example .npmrc
npm run doctor:registry
```

See full guide: `docs/ENV_REGISTRY_RESTRICTIONS.md`.

## What you need to do to achieve this migration (checklist)

1. Initialize npm project and add React/Vite/TypeScript deps.
2. Create Vite config + TS configs.
3. Move static JS logic into React state/hooks in `pages` + `components`.
4. Keep one SPA root (`App.tsx`) and render via `main.tsx`.
5. Replace DOM query manipulation with component props/state.
6. Update scripts to `dev/build/preview` and run through npm.
