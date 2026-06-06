# CLAUDE.md

## Coding Rules
- Keep every change under 200 lines. If a task exceeds that, stop and say so.
- One concern per response. Do not add unrequested features or refactors.
- Minimal correct solution only. No over-engineering or premature abstraction.
- Never scaffold boilerplate a CLI handles. Assume dependencies are already installed.
- Do not add dependencies without asking first.

## Stack
React + TypeScript + Vite + Tailwind v4 (@import "tailwindcss", no config file) + TipTap + Zustand + Dexie.js + Fuse.js

## Key Decisions
- Annotations (@def, @ref, @section, @title, @tag) use ProseMirror decorations, not marks — decorations are purely visual and never modify content
- Hover detection uses onMouseMove, not onMouseEnter/onMouseLeave — more reliable for inline spans
- activeNoteId is mirrored in a ref (activeNoteIdRef) to avoid stale closures in TipTap's onUpdate
- COMMANDS.length = 0 before every push to prevent HMR duplication
- Dexie is on version 2 — increment version number for any schema change
- Sidebar order is frozen on mount, only updates on note create/delete, never on save
