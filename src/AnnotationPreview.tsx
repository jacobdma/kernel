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
      className="k-anno-preview"
      style={{ top: y + 8, left: x }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {entries.map((e, i) => (
        <div key={i} onClick={() => onSelect(e.noteId, e.name)} className="k-anno-entry">
          <span className="k-anno-entry-title">{e.title}</span>
          <span className="k-anno-entry-line">{e.line}</span>
        </div>
      ))}
    </div>
  )
}
