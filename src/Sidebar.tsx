import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Note } from './db'

interface Props {
  activeId: number | null
  onSelect: (note: Note) => void
  onDelete: (note: Note) => void
}

export default function Sidebar({ activeId, onSelect, onDelete }: Props) {
  const notes = useLiveQuery(() => db.notes.orderBy('modified').reverse().toArray())

  return (
    <div className="w-56 h-screen border-r border-gray-200 p-3 flex flex-col gap-1">
      {notes?.map(note => (
        <div key={note.id} className={`flex items-center rounded px-2 py-1 ${activeId === note.id ? 'bg-gray-100' : ''}`}>
          <button onClick={() => onSelect(note)} className="flex-1 text-left text-sm truncate">
            {note.title || 'Untitled'}
          </button>
          <button onClick={() => onDelete(note)} className="text-gray-300 hover:text-red-400 text-xs ml-1">✕</button>
        </div>
      ))}
    </div>
  )
}
