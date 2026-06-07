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
npm run dev      # start the dev server (Vite HMR)
npm run build    # type-check + production build
npm run preview  # serve the production build locally
```

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘P` / `Ctrl+P` | Open command palette |
| `/` | Open slash-command menu |

## Structure

- `src/App.tsx` — root: editor setup, autosave, registry rebuild, hover previews.
- `src/db.ts` — Dexie schema for notes and the annotation registry.
- `src/Sidebar.tsx` · `CommandPalette.tsx` · `AnnotationPreview.tsx` · `TableContextMenu.tsx` — UI.
- `src/extensions/` — TipTap extensions: annotation decorations and slash commands.
- `src/index.css` — design tokens and all component styles (no separate CSS files).

## Annotation syntax

| Annotation | Purpose |
|---|---|
| `@title {Name}` | Sets the note title and registers a navigable anchor |
| `@section {Name}` | Section heading anchor; reachable via `@ref` |
| `@def {name}` | Defines a term; hover shows all back-references |
| `@ref {name}` | References a definition; renders resolved/unresolved |
| `@tag {name}` | Tags the note; filterable in the sidebar |
