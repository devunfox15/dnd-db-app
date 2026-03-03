# DM Dashboard (React + TypeScript + Vite SPA)

This project is now migrated to a **React + TypeScript + Vite** single-page application using **npm**.

## What changed

- Migrated from plain HTML/CSS/JS to Vite React TS.
- Added SPA-oriented structure with:
  - `src/pages`
  - `src/components`
  - `src/App.tsx`
  - `src/app.js` (bridge/metadata file kept per your request)
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
- `src/app.js` – requested app.js bridge/metadata
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
