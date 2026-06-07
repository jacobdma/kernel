// Left island: note list with newest-first ordering, tag filtering, and
// create/delete/search controls.
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Note } from './db'
import NoteRow from './NoteRow'
import ConfirmDialog from './ConfirmDialog'

interface Props {
    activeId: number | null
    onSelect: (note: Note) => void
    onDelete: (note: Note) => void
    onDuplicate: (note: Note) => void
    onNew: () => void
    onSearch: () => void
    onHelp: () => void
    onSettings: () => void
}

export default function Sidebar({ activeId, onSelect, onDelete, onDuplicate, onNew, onSearch, onHelp, onSettings }: Props) {
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const [orderedIds, setOrderedIds] = useState<number[]>([])
    // Desktop right-click menu position/target, and the note pending delete.
    const [rowMenu, setRowMenu] = useState<{ x: number; y: number; note: Note } | null>(null)
    const [confirmNote, setConfirmNote] = useState<Note | null>(null)
    const notes = useLiveQuery(() => db.notes.toArray())

    // Dismiss the row menu on any outside mousedown (the menu stops propagation).
    useEffect(() => {
        if (!rowMenu) return
        const close = () => setRowMenu(null)
        window.addEventListener('mousedown', close)
        return () => window.removeEventListener('mousedown', close)
    }, [rowMenu])

    // Maintain a stable display order that survives live updates: newly-seen
    // notes are sorted newest-first and prepended, existing rows keep their
    // position, and deleted notes are pruned. Using the functional updater (not
    // `notes` directly) avoids re-sorting the whole list on every edit, which
    // would otherwise make the active note jump to the top while typing.
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
            // Nothing added and nothing removed: return prev to skip a re-render.
            if (additions.length === 0 && pruned.length === prev.length) return prev
            return [...additions, ...pruned]
        })
    }, [notes])

    const byId = new Map((notes ?? []).map(n => [n.id!, n]))
    const sorted = orderedIds.map(id => byId.get(id)).filter(Boolean) as Note[]
    const filtered = activeTag ? sorted.filter(n => n.tags.includes(activeTag)) : sorted

    return (
    <div className="k-island k-sidebar">
      <div className="k-side-head">
        <span className="k-wordmark">kernel</span>
        <button onClick={onSettings} className="k-iconbtn" aria-label="Settings" title="Settings">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {activeTag && (
        <button onClick={() => setActiveTag(null)} className="k-tagclear">
          <span aria-hidden>✕</span> #{activeTag}
        </button>
      )}

      <div className="k-notelist">
        {filtered.length === 0 && <p className="k-empty-side">No notes</p>}
        {filtered.map(note => (
          <NoteRow
            key={note.id}
            note={note}
            active={activeId === note.id}
            onSelect={onSelect}
            onDuplicate={onDuplicate}
            onRequestDelete={setConfirmNote}
            onContextMenu={(e, n) => { e.preventDefault(); setRowMenu({ x: e.clientX, y: e.clientY, note: n }) }}
            onTagClick={setActiveTag}
          />
        ))}
      </div>

      <div className="k-side-actions">
        <button onClick={onNew} className="k-newnote">
          <span aria-hidden>+</span> New Note
        </button>
        <button onClick={onSearch} className="k-sqbtn" aria-label="Search" title="Search ⌘P">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        <button onClick={onHelp} className="k-sqbtn" aria-label="Open welcome guide" title="Welcome guide">?</button>
      </div>

      {rowMenu && (
        <div className="k-menu" style={{ top: rowMenu.y, left: rowMenu.x }} onMouseDown={e => e.stopPropagation()}>
          <button className="k-menu-item" onClick={() => { onDuplicate(rowMenu.note); setRowMenu(null) }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Duplicate
          </button>
          <button className="k-menu-item danger" onClick={() => { setConfirmNote(rowMenu.note); setRowMenu(null) }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" />
            </svg>
            Delete
          </button>
        </div>
      )}

      {confirmNote && (
        <ConfirmDialog
          message={`Delete “${confirmNote.title || 'Untitled'}”? This can't be undone.`}
          onConfirm={() => { onDelete(confirmNote); setConfirmNote(null) }}
          onCancel={() => setConfirmNote(null)}
        />
      )}
    </div>
    )
}
