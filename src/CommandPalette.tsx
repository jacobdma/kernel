// ⌘P command palette: fuzzy-searches note titles and registry entries
// (annotation names/types) with Fuse.js and routes the selection back to App.
import { useEffect, useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Note, RegistryEntry } from './db'

type Result =
  | { kind: 'note'; note: Note }
  | { kind: 'registry'; entry: RegistryEntry }

interface Props {
  open: boolean
  onClose: () => void
  onSelectNote: (note: Note) => void
  onSelectEntry: (entry: RegistryEntry) => void
}

export default function CommandPalette({ open, onClose, onSelectNote, onSelectEntry }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const notes = useLiveQuery(() => db.notes.toArray())
  const registry = useLiveQuery(() => db.registry.toArray())

  // Build each Fuse index only when its source data changes, not per keystroke.
  const noteFuse = useMemo(() => new Fuse(notes ?? [], { keys: ['title'], threshold: 0.4 }), [notes])
  const registryFuse = useMemo(() => new Fuse(registry ?? [], { keys: ['name', 'type'], threshold: 0.4 }), [registry])

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 0) }
  }, [open])

  if (!open) return null

  const noteResults: Result[] = query
    ? noteFuse.search(query).map(r => ({ kind: 'note', note: r.item }))
    : (notes ?? []).map(n => ({ kind: 'note', note: n }))

  const registryResults: Result[] = query
    ? registryFuse.search(query).map(r => ({ kind: 'registry', entry: r.item }))
    : []

  const results = [...noteResults, ...registryResults].slice(0, 10)

  return (
    <div className="k-pal-scrim" onClick={onClose}>
      <div className="k-pal" onClick={e => e.stopPropagation()}>
        <div className="k-pal-search">
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes and definitions…"
          />
        </div>
        <div className="k-pal-list">
          {results.length === 0 && <p className="k-pal-empty">No results</p>}
          {results.map((r) => r.kind === 'note' ? (
            <button key={`note-${r.note.id}`} onClick={() => { onSelectNote(r.note); onClose() }} className="k-pal-opt">
              <span className="k-pal-kind">note</span>
              <span>{r.note.title || 'Untitled'}</span>
            </button>
          ) : (
            <button key={`reg-${r.entry.id}`} onClick={() => { onSelectEntry(r.entry); onClose() }} className="k-pal-opt">
              <span className={`k-pal-kind kind-${r.entry.type}`}>{r.entry.type}</span>
              <span>{r.entry.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
