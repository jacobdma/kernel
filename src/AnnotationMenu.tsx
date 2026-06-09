// Two-level popup for the '@' trigger. Level 1 lists the annotation types;
// picking "ref" advances to Level 2 — existing reference targets (names defined
// somewhere as def/section/title) read live from the registry. Selecting a name
// inserts the completed `@ref {name}`. Level-2 typing filters in-menu only (it
// never touches the document), per the two-step design.
import { forwardRef, useImperativeHandle, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { AnnoType } from './extensions/AnnotationCommand'

export interface AnnotationMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface Props {
  items: AnnoType[]
  command: (selection: { type: AnnoType; name?: string }) => void
}

const KIND_LABEL: Record<string, string> = { def: 'def', section: 'sec', title: 'title' }

const AnnotationMenu = forwardRef<AnnotationMenuHandle, Props>(({ items, command }, ref) => {
  const [level, setLevel] = useState<1 | 2>(1)
  const [selected, setSelected] = useState(0)
  const [filter, setFilter] = useState('')

  // Distinct names that exist as a definition (def/section/title) — the things
  // a @ref can point at.
  const targets = useLiveQuery(async () => {
    const entries = await db.registry.where('type').anyOf('def', 'section', 'title').toArray()
    const kinds = new Map<string, string>()
    for (const e of entries) if (!kinds.has(e.name)) kinds.set(e.name, e.type)
    return [...kinds].map(([name, kind]) => ({ name, kind })).sort((a, b) => a.name.localeCompare(b.name))
  }, []) ?? []

  const names = filter ? targets.filter(t => t.name.toLowerCase().includes(filter.toLowerCase())) : targets

  function chooseType(type: AnnoType) {
    if (type === 'ref' && targets.length > 0) { setLevel(2); setSelected(0); setFilter('') }
    else command({ type })
  }

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      const key = event.key
      if (level === 1) {
        if (key === 'ArrowUp') { setSelected(s => Math.max(0, s - 1)); return true }
        if (key === 'ArrowDown') { setSelected(s => Math.min(items.length - 1, s + 1)); return true }
        if (key === 'Enter') { if (items[selected]) chooseType(items[selected]); return true }
        return false
      }
      if (key === 'ArrowUp') { setSelected(s => Math.max(0, s - 1)); return true }
      if (key === 'ArrowDown') { setSelected(s => Math.min(names.length - 1, s + 1)); return true }
      if (key === 'Enter') { if (names[selected]) command({ type: 'ref', name: names[selected].name }); return true }
      if (key === 'Escape') { setLevel(1); setSelected(0); return true }
      if (key === 'Backspace') {
        if (filter) { setFilter(f => f.slice(0, -1)); setSelected(0) } else { setLevel(1); setSelected(0) }
        return true
      }
      if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        setFilter(f => f + key); setSelected(0); return true
      }
      return true
    },
  }))

  if (level === 2) {
    return (
      <div className="k-slash">
        {names.length === 0 && <p className="k-slash-empty">No matches</p>}
        {names.map((t, i) => (
          <button key={t.name} onClick={() => command({ type: 'ref', name: t.name })}
            className={`k-slash-item ${i === selected ? 'sel' : ''}`}>
            <span>{t.name}</span>
            <span className="k-slash-sc">{KIND_LABEL[t.kind] ?? t.kind}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="k-slash">
      {items.length === 0 && <p className="k-slash-empty">No annotations</p>}
      {items.map((type, i) => (
        <button key={type} onClick={() => chooseType(type)}
          className={`k-slash-item ${i === selected ? 'sel' : ''}`}>
          <span>@{type}</span>
          {type === 'ref' && <span className="k-slash-sc">›</span>}
        </button>
      ))}
    </div>
  )
})

export default AnnotationMenu
