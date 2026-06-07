// Bottom-of-editor formatting toolbar. The main view shows list / table / format
// icons; "list" and "format" swap the bar into a sub-menu of options. Buttons
// reflect the active mark/node at the cursor.
import { useEffect, useReducer, useState } from 'react'
import type { Editor } from '@tiptap/react'

function Ico({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

interface ToolProps { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }
function Tool({ label, active, onClick, children }: ToolProps) {
  return (
    <button className={`k-tool ${active ? 'active' : ''}`} aria-label={label} title={label}
      onMouseDown={e => e.preventDefault()} onClick={onClick}>
      {children}
    </button>
  )
}

const Back = <Ico><path d="m15 18-6-6 6-6" /></Ico>
const ListIco = <Ico><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Ico>
const ListOrdered = <Ico><path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></Ico>
const TableIco = <Ico><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></Ico>
const TypeIco = <Ico><path d="M4 7V4h16v3M9 20h6M12 4v16" /></Ico>
const BoldIco = <Ico><path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" /></Ico>
const ItalicIco = <Ico><path d="M19 4h-9M14 20H5M15 4 9 20" /></Ico>
const UnderlineIco = <Ico><path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" /></Ico>
const StrikeIco = <Ico><path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16" /></Ico>
const CodeIco = <Ico><path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /></Ico>

export default function EditorToolbar({ editor }: { editor: Editor }) {
  const [view, setView] = useState<'main' | 'format' | 'list'>('main')
  const [, force] = useReducer(x => x + 1, 0)

  // Re-render on every editor change so active states stay in sync.
  useEffect(() => {
    editor.on('transaction', force)
    return () => { editor.off('transaction', force) }
  }, [editor])

  const chain = () => editor.chain().focus()
  const is = (name: string, attrs?: Record<string, unknown>) => editor.isActive(name, attrs)

  if (view === 'format') {
    return (
      <div className="k-toolbar">
        <Tool label="Back" onClick={() => setView('main')}>{Back}</Tool>
        <Tool label="Bold" active={is('bold')} onClick={() => chain().toggleBold().run()}>{BoldIco}</Tool>
        <Tool label="Italic" active={is('italic')} onClick={() => chain().toggleItalic().run()}>{ItalicIco}</Tool>
        <Tool label="Underline" active={is('underline')} onClick={() => chain().toggleUnderline().run()}>{UnderlineIco}</Tool>
        <Tool label="Strikethrough" active={is('strike')} onClick={() => chain().toggleStrike().run()}>{StrikeIco}</Tool>
        <span className="k-tool-sep" />
        <Tool label="Heading 1" active={is('heading', { level: 1 })} onClick={() => chain().toggleHeading({ level: 1 }).run()}>H1</Tool>
        <Tool label="Heading 2" active={is('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}>H2</Tool>
        <Tool label="Heading 3" active={is('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}>H3</Tool>
        <span className="k-tool-sep" />
        <Tool label="Code block" active={is('codeBlock')} onClick={() => chain().toggleCodeBlock().run()}>{CodeIco}</Tool>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div className="k-toolbar">
        <Tool label="Back" onClick={() => setView('main')}>{Back}</Tool>
        <Tool label="Bullet list" active={is('bulletList')} onClick={() => chain().toggleBulletList().run()}>{ListIco}</Tool>
        <Tool label="Numbered list" active={is('orderedList')} onClick={() => chain().toggleOrderedList().run()}>{ListOrdered}</Tool>
      </div>
    )
  }

  return (
    <div className="k-toolbar">
      <Tool label="Lists" onClick={() => setView('list')}>{ListIco}</Tool>
      <Tool label="Insert table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run()}>{TableIco}</Tool>
      <Tool label="Format text" onClick={() => setView('format')}>{TypeIco}</Tool>
    </div>
  )
}
