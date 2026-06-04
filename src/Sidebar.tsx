import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Note } from './db'

interface Props {
  activeId: number | null
  onSelect: (note: Note) => void
  onDelete: (note: Note) => void
}

export default function Sidebar({ activeId, onSelect, onDelete }: Props) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const notes = useLiveQuery(() => db.notes.orderBy('modified').reverse().toArray())

  const filtered = activeTag ? notes?.filter(n => n.tags.includes(activeTag)) : notes

  return (
    <div className="w-56 h-screen border-r border-gray-200 p-3 flex flex-col gap-1">
      {activeTag && (
        <button onClick={() => setActiveTag(null)} className="text-xs text-indigo-500 mb-1 text-left">
          ✕ #{activeTag}
        </button>
      )}
      {filtered?.map(note => (
        <div key={note.id} className={`flex flex-col rounded px-2 py-1 ${activeId === note.id ? 'bg-gray-100' : ''}`}>
          <div className="flex items-center">
            <button onClick={() => onSelect(note)} className="flex-1 text-left text-sm truncate">
              {note.title || 'Untitled'}
            </button>
            <button onClick={() => onDelete(note)} className="text-gray-300 hover:text-red-400 text-xs ml-1">✕</button>
          </div>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {note.tags.map(tag => (
                <button key={tag} onClick={() => setActiveTag(tag)}
                  className="text-xs text-indigo-400 hover:text-indigo-600">
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
