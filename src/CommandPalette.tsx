import { useEffect, useRef, useState } from 'react'
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

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 0) }
  }, [open])

  if (!open) return null

  const noteResults: Result[] = query
    ? new Fuse(notes ?? [], { keys: ['title'], threshold: 0.4 }).search(query).map(r => ({ kind: 'note', note: r.item }))
    : (notes ?? []).map(n => ({ kind: 'note', note: n }))

  const registryResults: Result[] = query
    ? new Fuse(registry ?? [], { keys: ['name', 'type'], threshold: 0.4 }).search(query).map(r => ({ kind: 'registry', entry: r.item }))
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
          {results.map((r, i) => r.kind === 'note' ? (
            <button key={i} onClick={() => { onSelectNote(r.note); onClose() }} className="k-pal-opt">
              <span className="k-pal-kind">note</span>
              <span>{r.note.title || 'Untitled'}</span>
            </button>
          ) : (
            <button key={i} onClick={() => { onSelectEntry(r.entry); onClose() }} className="k-pal-opt">
              <span className={`k-pal-kind kind-${r.entry.type}`}>{r.entry.type}</span>
              <span>{r.entry.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
