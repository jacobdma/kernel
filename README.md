# kernel

A local-first notes app with a literate-knowledge layer. Notes are written in a
rich-text editor and enriched with `@`-annotations — `@title`, `@section`,
`@def`, `@ref`, `@tag` — that resolve into a queryable registry. `@ref`s link to
their `@def`/`@section`/`@title` definitions, render as resolved/unresolved, and
surface back-references on hover. Everything persists in the browser; no backend.

## Stack

React 19 · TypeScript · Vite · TipTap/ProseMirror (editor) · Dexie/IndexedDB
(persistence) · Fuse.js (fuzzy search) · Tailwind v4 + custom design tokens
(`src/index.css`).

## Run

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
```

## Structure

- `src/App.tsx` — root: editor setup, autosave, registry rebuild, hover previews.
- `src/db.ts` — Dexie schema for notes and the annotation registry.
- `src/Sidebar.tsx` · `CommandPalette.tsx` · `AnnotationPreview.tsx` · `TableContextMenu.tsx` — UI.
- `src/extensions/` — TipTap extensions: annotation decorations and slash commands.
