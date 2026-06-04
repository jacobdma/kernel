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
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-32" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search notes and definitions..."
          className="w-full px-4 py-3 text-sm outline-none border-b border-gray-100 rounded-t-lg"
        />
        <div className="max-h-80 overflow-y-auto p-1">
          {results.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">No results</p>}
          {results.map((r, i) => r.kind === 'note' ? (
            <button key={i} onClick={() => { onSelectNote(r.note); onClose() }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100">
              <span className="text-gray-400 text-xs">note</span>
              <span>{r.note.title}</span>
            </button>
          ) : (
            <button key={i} onClick={() => { onSelectEntry(r.entry); onClose() }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100">
              <span className="text-gray-400 text-xs">{r.entry.type}</span>
              <span>{r.entry.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
