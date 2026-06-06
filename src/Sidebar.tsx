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
    <div className="w-56 h-screen border-r border-gray-200 p-3 flex flex-col gap-1">
        <div className="flex gap-1 mb-2">
            <button onClick={onNew} className="flex-1 text-left text-sm px-2 py-1 bg-black text-white rounded">
                New Note
            </button>
        </div>
        <button onClick={onSearch} className="px-2 py-1 text-gray-400 hover:text-gray-600 border border-gray-200 rounded text-sm">
            Search ⌘P
        </button>
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
