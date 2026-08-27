# Barcode Generator

A single-page Vue 3 app for generating CODE128 barcodes from equipment IDs. Organize inputs into profiles, preview barcodes instantly, and download each as a high-resolution PNG. Everything is persisted in localStorage, and barcodes regenerate automatically so they are always ready to scan.

## Features

- **Profiles & records** — a Notion-style sidebar lists all profiles and the records (barcode input fields) inside them. Click a record to jump to it; hover a profile for rename / new record / delete actions.
- **Timestamped profile names** — new profiles are automatically named with the current local time as `yyyyMMddHHmmss` (e.g. `20260827140430`) and can be renamed inline (pencil button or double-click the name).
- **Automatic barcode generation** — every record that has a code renders its barcode on page load and on every profile switch, so barcodes are always ready to scan without clicking Generate.
- **Adjustable size** — a single "Barcode Size" slider (S/M/L/XL/XXL) controls bar width for all records and re-renders them immediately.
- **PNG export** — "Download PNG" re-renders each barcode onto an off-screen canvas at 3x scale for a sharper download than the on-screen preview.
- **Local persistence** — profiles, records, and the active selection are saved to localStorage via `pinia-plugin-persistedstate` and restored on the next visit. A default profile with one empty record is created on first run.
- **Update-time tracking** — each record shows when its code last changed (e.g. "Updated 5 min ago"). Generating or downloading a barcode never affects this time.
- **Inline validation** — empty input or characters CODE128 can't encode (non-ASCII) surface an inline error instead of a broken barcode.

## Tech Stack

| Tool | Version | Purpose |
| --- | --- | --- |
| [Vite](https://vite.dev) | v8 | Build tool with instant cold start and fast HMR |
| [Vue 3](https://vuejs.org) | v3.5 | Progressive framework using `<script setup>` + Composition API |
| [JsBarcode](https://github.com/lindell/JsBarcode) | v3.12 | CODE128 barcode rendering onto SVG/canvas |
| [Element Plus](https://element-plus.org) | v2.14 | Vue 3 UI library, auto-imported via `unplugin` |
| [Vue Router](https://router.vuejs.org) | v5 | Official router, configured with `createWebHistory` |
| [Pinia](https://pinia.vuejs.org) | v3 | State management for profiles/records (`barcode` store) |
| [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate) | v4 | localStorage persistence for the Pinia store |
| [VueUse](https://vueuse.org) | v14 | `useNow` keeps the relative update times live |
| [Vue DevTools](https://devtools.vuejs.org) | v8 | Browser-independent inspector via `vite-plugin-vue-devtools` |
| [TypeScript](https://www.typescriptlang.org) | ~v6 | Strict type-checking through `vue-tsc` |

## Requirements

- Node.js (LTS recommended)
- [pnpm](https://pnpm.io) (the scripts below assume pnpm)

## Commands

```bash
pnpm install     # install dependencies
pnpm dev         # start the Vite dev server with HMR
pnpm build       # type-check (vue-tsc -b) then build for production
pnpm preview     # preview the production build locally
```

There is **no test runner, linter, or formatter** configured. Type-checking runs as part of `pnpm build` via `vue-tsc -b` — run `pnpm build` to catch type errors.

## Project Structure

```
.
├── index.html
├── nginx_config.txt          # reverse-proxy headers for an nginx config fronting this app
├── vite.config.ts            # Vite config (Vue plugin, devtools, auto-import, alias)
├── tsconfig.json             # Project references -> tsconfig.app.json + tsconfig.node.json
├── tsconfig.app.json         # App code TS config (strict flags, @/* path alias)
├── package.json
├── CR/                       # change requests that drive development
│   └── 2026-08-27.md         # CR1: profile feature
└── src
    ├── main.ts               # App bootstrap (Pinia + persistence, Element Plus, router)
    ├── App.vue               # Just <router-view />
    ├── router.ts             # createWebHistory router
    ├── style.css             # Global stylesheet
    ├── model.ts              # Domain types: Profile, Record
    ├── store.ts              # Pinia store: profile/record CRUD + persistence
    └── views/
        └── HomeView.vue      # All UI: sidebar directory + barcode generator
```

## Architecture

The app is a single view split into three layers:

| Layer | File | Responsibility |
| --- | --- | --- |
| Domain model | `src/model.ts` | `Profile { id, name, records }` and `Record { id, code, lastUpdated }` interfaces |
| Store | `src/store.ts` | Pinia store (`barcode`): profile/record CRUD, active selection, persistence |
| View | `src/views/HomeView.vue` | Sidebar directory, barcode generation, runtime-only UI state |

### State: persisted vs. runtime

- **Persisted** (`persist: true` → localStorage key `barcode`): the `profiles` array plus `activeProfileId` / `activeRecordId`.
- **Runtime-only** (a reactive `Map` inside `HomeView.vue`): each record's `lastGenerated` and `errorMessage`. Deliberately not persisted — since barcodes auto-generate from the current code, there is nothing worth saving.
- **`lastUpdated` semantics**: `store.setCode()` only bumps `lastUpdated` when the code actually changes. Barcode generation never goes through the store, so generating or downloading can never affect the update time.
- **Invariants**: there is always at least one profile, and every profile has at least one record (delete actions auto-recreate when the last item is removed). `ensureDefaults()` repairs invalid state restored from localStorage (e.g. no profiles or stale active ids).

### Barcode rendering is imperative, not reactive

`jsbarcode` draws directly onto SVG/canvas elements via `JsBarcode(target, value, options)` — it is not a Vue component. `renderBarcode()` looks up the record's SVG from a `svgRefs` map and re-draws on demand.

- **Result SVGs use `v-show`, not `v-if`.** The barcode `<svg>` must stay mounted at all times so its `ref` is captured into `svgRefs` before `generate()` runs.
- **Auto-generation waits for `nextTick`.** Switching profiles rebuilds the `<svg>` elements through `v-for`, so refs must re-register before rendering. `autoGenerateAll()` (wired to a `watch` on `activeProfileId` and to `onMounted`) awaits `nextTick`, then generates every record whose code is non-empty; empty records keep their clean empty state.
- **PNG download renders a second, higher-resolution pass.** `downloadPng()` draws onto a detached `<canvas>` at 3x scale rather than exporting the on-screen SVG.

### Conventions & gotchas

- **`Record` shadows TypeScript's built-in utility type.** `src/model.ts` exports `interface Record`, so files that import it cannot use `Record<K, V>` — use `Map` instead.
- **Profile naming**: `createProfile()` falls back to a local-time `yyyyMMddHHmmss` timestamp (e.g. `20260827140430`) when no name is given; the first-run default profile is named "Default Profile".
- **Element Plus components are auto-imported** — do not import/register `<el-*>` components manually in templates (`unplugin-vue-components` + `ElementPlusResolver` handles it via `vite.config.ts`). Only imperative APIs (`ElMessageBox`) need explicit imports from `'element-plus'`.
- **`@/` alias** maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).
- **Layout**: a two-column grid `2fr 8fr` (profile sidebar : barcode workspace) that stacks into a single column below 900px.
- User-facing strings are in English.

### Generated files (do not hand-edit)

- `components.d.ts` — regenerated by `unplugin-vue-components`
- `auto-imports.d.ts` — regenerated by `unplugin-auto-import`

## Deployment

`nginx_config.txt` contains reverse-proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-*`) intended for an nginx config fronting this app.

## License

Apache-2.0 — see [LICENSE](./LICENSE).
