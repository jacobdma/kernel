import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Note } from './db'

interface Props {
    activeId: number | null
    onSelect: (note: Note) => void
    onDelete: (note: Note) => void
    onNew: () => void
    onSearch: () => void
}

export default function Sidebar({ activeId, onSelect, onDelete, onNew, onSearch }: Props) {
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const [orderedIds, setOrderedIds] = useState<number[]>([])
    const notes = useLiveQuery(() => db.notes.toArray())

    useEffect(() => {
        if (!notes) return
        setOrderedIds(prev => {
            const noteIds = new Set(notes.map(n => n.id!))
            const known = new Set(prev)
            const additions = notes
                .filter(n => !known.has(n.id!))
                .sort((a, b) => b.modified.getTime() - a.modified.getTime())
                .map(n => n.id!)
            const pruned = prev.filter(id => noteIds.has(id))
            if (additions.length === 0 && pruned.length === prev.length) return prev
            return [...additions, ...pruned]
        })
    }, [notes])

    const sorted = orderedIds.map(id => notes?.find(n => n.id! === id)).filter(Boolean) as Note[]
    const filtered = activeTag ? sorted.filter(n => n.tags.includes(activeTag)) : sorted

  return (
    <div className="k-island k-sidebar">
      <div className="k-side-head">
        <div className="k-brand">
          <span className="k-wordmark">kernel</span>
        </div>
      </div>

      <button onClick={onNew} className="k-newnote">
        <span aria-hidden>+</span> New Note
      </button>

      {activeTag && (
        <button onClick={() => setActiveTag(null)} className="k-tagclear">
          <span aria-hidden>✕</span> #{activeTag}
        </button>
      )}

      <div className="k-notelist">
        {filtered.length === 0 && <p className="k-empty-side">No notes</p>}
        {filtered.map(note => (
          <div key={note.id} className={`k-noterow ${activeId === note.id ? 'active' : ''}`}>
            <div className="k-noterow-top">
              <button onClick={() => onSelect(note)} className="k-notebtn">
                <span className={`k-notetitle ${note.title ? '' : 'muted'}`}>{note.title || 'Untitled'}</span>
              </button>
              <button onClick={() => onDelete(note)} className="k-notedel" aria-label="Delete note">✕</button>
            </div>
            {note.tags.length > 0 && (
              <div className="k-noterow-tags">
                {note.tags.map(tag => (
                  <button key={tag} onClick={() => setActiveTag(tag)} className="k-tag-mini">
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="k-side-foot">
        <button onClick={onSearch} className="k-foot-hint">Search</button>
        <span className="k-kbd-cap">⌘P</span>
      </div>
    </div>
  )
}
