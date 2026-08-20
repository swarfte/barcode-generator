# Barcode Generator

A single-page Vue 3 app for generating CODE128 barcodes from equipment IDs. Enter one or more IDs, preview the barcode instantly, and download each as a high-resolution PNG.

> **Note:** The package name (`barcode-generator`... internally `vue-base`) and directory name (`PCMS-importfile-generator`) are leftovers from the Vue 3 starter template this project was scaffolded from — they have no relation to actual functionality.

## Features

- **Multiple barcodes at once** — add/remove rows to generate several barcodes in one session (`+` / `−` buttons, at least one row is always kept).
- **Live CODE128 rendering** — barcodes are drawn with [JsBarcode](https://github.com/lindell/JsBarcode) directly onto an on-screen SVG as soon as you click "Generate".
- **Adjustable size** — a single "Barcode Size" slider (S/M/L/XL/XXL) controls bar width for all rows and re-renders them immediately.
- **PNG export** — "Download PNG" re-renders each barcode onto an off-screen canvas at 3x scale for a sharper download than the on-screen preview.
- **Inline validation** — empty input or characters CODE128 can't encode (non-ASCII) surface an inline error instead of a broken barcode.

## Tech Stack

| Tool | Version | Purpose |
| --- | --- | --- |
| [Vite](https://vite.dev) | v8 | Build tool with instant cold start and fast HMR |
| [Vue 3](https://vuejs.org) | v3.5 | Progressive framework using `<script setup>` + Composition API |
| [JsBarcode](https://github.com/lindell/JsBarcode) | v3.12 | CODE128 barcode rendering onto SVG/canvas |
| [Element Plus](https://element-plus.org) | v2.14 | Vue 3 UI library, auto-imported via `unplugin` |
| [Vue Router](https://router.vuejs.org) | v5 | Official router, configured with `createWebHistory` |
| [Pinia](https://pinia.vuejs.org) | v3 | Type-safe state management (wired up, currently unused) |
| [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate) | v4 | Opt-in localStorage persistence for Pinia stores |
| [VueUse](https://vueuse.org) | v14 | Collection of essential Vue composition utilities |
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
└── src
    ├── main.ts               # App bootstrap (Pinia, Element Plus, router)
    ├── App.vue                # Just <router-view />
    ├── router.ts               # createWebHistory router
    ├── style.css                # Global stylesheet
    └── views/
        └── HomeView.vue      # All app logic and UI lives here
```

## Architecture

All real logic lives in `src/views/HomeView.vue`; no other views/routes have been added.

- **Everything is one view.** `HomeView.vue` owns all state: a reactive list of `BarcodeItem` rows (`{ id, equipmentId, lastGenerated, errorMessage }`), one global `barWidth` slider shared across all rows, and a `Map<id, SVGSVGElement>` (`svgRefs`) tracking each row's live SVG element for imperative rendering.
- **Barcode rendering is imperative, not reactive.** `jsbarcode` draws directly onto SVG/canvas elements via `JsBarcode(target, value, options)` — it is not a Vue component. `renderBarcode()` looks up the row's SVG from `svgRefs` and re-draws on demand; it must be called manually after generating or after `barWidth` changes (`onWidthChange` re-renders every row that already has `lastGenerated`).
- **Result SVGs use `v-show`, not `v-if`.** The barcode `<svg>` must stay mounted at all times so its `ref` is captured into `svgRefs` before `generate()` runs; toggling with `v-if` would remove the ref right when it's needed.
- **PNG download renders a second, higher-resolution pass.** `downloadPng()` creates a detached `<canvas>` and calls `JsBarcode` again with a `scale` multiplier (3x) rather than exporting the on-screen SVG, so downloads are higher-res than the preview.
- **Multi-barcode support**: `addItem`/`removeItem` push/splice the `items` array; at least one row is always kept (`removeItem` no-ops if `items.length <= 1`).
- **Element Plus components are auto-imported** — do not import/register `<el-*>` components manually in templates (`unplugin-vue-components` + `ElementPlusResolver` handles it via `vite.config.ts`). Only imperative APIs (`ElMessage`, `ElMessageBox`, `ElNotification`) need explicit imports from `'element-plus'`.
- **`@/` alias** maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).
- **Pinia is wired up but unused** — no stores exist yet. If adding one, note the persist plugin must register on `pinia` *before* `app.use(pinia)` in `src/main.ts`.
- User-facing strings (labels, placeholders, error messages) are in English.

### Generated files (do not hand-edit)

- `components.d.ts` — regenerated by `unplugin-vue-components`
- `auto-imports.d.ts` — regenerated by `unplugin-auto-import`

## Deployment

`nginx_config.txt` contains reverse-proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-*`) intended for an nginx config fronting this app.
