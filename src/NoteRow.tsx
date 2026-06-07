// One note row. On touch, swipe-left slides the row to reveal Duplicate + Delete
// actions; on desktop, right-click opens the same actions as a context menu.
import { useRef, useState } from 'react'
import type { Note } from './db'

const ACTIONS_W = 112 // two 56px action buttons revealed by a full swipe

interface Props {
  note: Note
  active: boolean
  onSelect: (note: Note) => void
  onDuplicate: (note: Note) => void
  onRequestDelete: (note: Note) => void
  onContextMenu: (e: React.MouseEvent, note: Note) => void
  onTagClick: (tag: string) => void
}

const DupIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const TrashIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export default function NoteRow({ note, active, onSelect, onDuplicate, onRequestDelete, onContextMenu, onTagClick }: Props) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const baseX = useRef(0)

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    baseX.current = dx
    setDragging(true)
  }
  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientX - startX.current
    setDx(Math.max(-ACTIONS_W, Math.min(0, baseX.current + delta)))
  }
  function onTouchEnd() {
    setDragging(false)
    setDx(dx < -ACTIONS_W / 2 ? -ACTIONS_W : 0)
  }
  function close() { setDx(0) }

  // When swiped open, the first tap on the row closes it rather than selecting.
  function handleSelect() {
    if (dx < 0) { close(); return }
    onSelect(note)
  }

  return (
    <div className={`k-noterow ${active ? 'active' : ''}`} onContextMenu={e => onContextMenu(e, note)}>
      <div className="k-noterow-actions">
        <button className="k-rowact dup" aria-label="Duplicate note" onClick={() => { onDuplicate(note); close() }}>{DupIcon}</button>
        <button className="k-rowact del" aria-label="Delete note" onClick={() => { onRequestDelete(note); close() }}>{TrashIcon}</button>
      </div>
      <div
        className="k-noterow-fg"
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? 'none' : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button onClick={handleSelect} className="k-notebtn">
          <span className={`k-notetitle ${note.title ? '' : 'muted'}`}>{note.title || 'Untitled'}</span>
        </button>
        {note.tags.length > 0 && (
          <div className="k-noterow-tags">
            {note.tags.map(tag => (
              <button key={tag} onClick={() => onTagClick(tag)} className="k-tag-mini">#{tag}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
