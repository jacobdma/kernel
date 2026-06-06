import type { Editor } from '@tiptap/react'

interface Props {
  x: number
  y: number
  editor: Editor
  onClose: () => void
}

const ITEMS = [
  { label: 'Insert row above', action: (e: Editor) => e.chain().focus().addRowBefore().run() },
  { label: 'Insert row below', action: (e: Editor) => e.chain().focus().addRowAfter().run() },
  { label: 'Insert column left', action: (e: Editor) => e.chain().focus().addColumnBefore().run() },
  { label: 'Insert column right', action: (e: Editor) => e.chain().focus().addColumnAfter().run() },
  null,
  { label: 'Delete row', action: (e: Editor) => e.chain().focus().deleteRow().run() },
  { label: 'Delete column', action: (e: Editor) => e.chain().focus().deleteColumn().run() },
  { label: 'Delete table', action: (e: Editor) => e.chain().focus().deleteTable().run() },
]

export default function TableContextMenu({ x, y, editor, onClose }: Props) {
  return (
    <div className="k-menu"
      style={{ top: y, left: x }}
      onMouseDown={e => e.stopPropagation()}>
      {ITEMS.map((item, i) =>
        item === null
          ? <div key={i} className="k-menu-sep" />
          : <button key={i}
              onClick={() => { item.action(editor); onClose() }}
              className="k-menu-item">
              {item.label}
            </button>
      )}
    </div>
  )
}
