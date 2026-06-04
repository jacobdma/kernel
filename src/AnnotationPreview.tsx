interface Entry {
  title: string
  line: string
  noteId: number
  name: string
}

interface Props {
  entries: Entry[]
  x: number
  y: number
  onSelect: (noteId: number, name: string) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export default function AnnotationPreview({ entries, x, y, onSelect, onMouseEnter, onMouseLeave }: Props) {
  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm text-sm text-gray-700 overflow-hidden"
      style={{ top: y + 8, left: x }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {entries.map((e, i) => (
        <div key={i} onClick={() => onSelect(e.noteId, e.name)}
          className={`p-3 cursor-pointer hover:bg-gray-50 ${i !== entries.length - 1 ? 'border-b border-gray-100' : ''}`}>
          <p className="font-semibold text-xs text-gray-400 mb-1">{e.title}</p>
          <p>{e.line}</p>
        </div>
      ))}
    </div>
  )
}
