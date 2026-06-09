// Root component. Owns the TipTap editor and wires together autosave, the
// annotation registry rebuild, hover previews, the command palette, and the
// table context menu. See the inline comments for the hover-preview state
// machine and the autosave/registry timing.
import { useEffect, useRef, useState } from 'react'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

import { Annotations, resolvedNames } from './extensions/Annotations'
import { AnnotationSuggest } from './extensions/AnnotationSuggest'
import { Placeholder } from './extensions/Placeholder'
import { useLiveQuery } from 'dexie-react-hooks'
import { SlashCommands, COMMANDS } from './extensions/SlashCommands'
import { TodoCommand } from './extensions/TodoCommand'
import { CodeCommand } from './extensions/CodeCommand'
import { FormattingCommands } from './extensions/FormattingCommands'
import { TableCommand } from './extensions/TableCommand'

import { db } from './db'
import type { Note, RegistryEntry } from './db'

import CommandPalette from './CommandPalette'
import Sidebar from './Sidebar'
import AnnotationPreview from './AnnotationPreview'
import TableContextMenu from './TableContextMenu'
import EditorToolbar from './EditorToolbar'
import SettingsPanel from './SettingsPanel'
import { useSettings } from './useSettings'

// Populate the slash-command registry the SlashCommands extension reads from.
// Done at module load (reset-then-push) so the list survives Fast Refresh
// re-evaluation without accumulating duplicate entries.
COMMANDS.length = 0
COMMANDS.push(TodoCommand, CodeCommand, TableCommand, ...FormattingCommands)

// Seeded once into an empty database as an onboarding note (see effect below).
const ONBOARDING_CONTENT = `<p>@title {Welcome to Kernel}</p>
<p>@tag {getting-started}</p>
<p></p>
<p>@section {Annotations}</p>
<p>Kernel uses <strong>annotations</strong> to connect ideas across notes. Type @ to start one.</p>
<p></p>
<p>@def {annotation} — a typed label that makes content searchable and linkable.</p>
<p>Try hovering over that @ref {annotation} to see where it's defined.</p>
<p></p>
<p>@section {Slash Commands}</p>
<p>Type / anywhere to open the command menu. A few to try:</p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"><p>Try /todo to create a task</p></li>
  <li data-type="taskItem" data-checked="false"><p>Try /table to insert a table</p></li>
  <li data-type="taskItem" data-checked="false"><p>Try /code to insert a code block</p></li>
</ul>
<p></p>
<p>@section {Navigation}</p>
<p>Use ⌘/Ctrl + P to search across all notes and definitions. Click any resolved @ref {annotation} to jump to its source.</p>`

// In-memory resolution for the ephemeral demo so its @ref renders resolved and
// hover previews work without writing anything to the registry.
const DEMO_TITLE = 'Welcome to Kernel'
const DEMO_REGISTRY = [
  { name: 'annotation', line: '@def {annotation} — a typed label that makes content searchable and linkable.' },
]

export default function App() {
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null)
  // Ephemeral demo: shows the onboarding content in the editor without creating
  // or saving a real note. Opened by the sidebar "?" button.
  const [demoOpen, setDemoOpen] = useState(false)
  // Mirror of activeNoteId for use inside the editor's onUpdate closure, which
  // captures stale state but always sees the current ref value.
  const activeNoteIdRef = useRef<number | null>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const registryEntries = useLiveQuery(() => db.registry.toArray(), [])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [preview, setPreview] = useState<{ entries: { title: string; line: string; noteId: number; name: string }[]; heading?: string; x: number; y: number } | null>(null)
  // Hover-preview timing refs (see handleEditorMouseMove for the state machine):
  // dismissTimeout closes the preview after the cursor leaves an annotation,
  // showTimeout delays opening it, and currentAnnotation tracks which
  // annotation name the cursor is currently over to avoid redundant work.
  const dismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentAnnotation = useRef<string | null>(null)
  const [tableMenu, setTableMenu] = useState<{ x: number; y: number } | null>(null)
  // Guards the one-time onboarding seed against StrictMode/double-effect re-runs.
  const seededRef = useRef(false)
  const { settings, setSettings } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit, 
      TaskList, 
      TaskItem.configure({ nested: true }), 
      SlashCommands, 
      Annotations,
      AnnotationSuggest,
      Placeholder,
      Link,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '<p></p>',
    // Debounced autosave: every keystroke resets a 500ms timer; only the final
    // edit in a burst actually writes to IndexedDB. Also rebuilds this note's
    // registry entries (annotation index) from the current text.
    onUpdate({ editor }) {
      if (!activeNoteIdRef.current) return
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(async () => {
        const text = editor.getText()

        // Title comes from an explicit @title annotation, else the first line.
        const titleMatch = text.match(/@title\s+\{([^}]+)\}/)
        const title = titleMatch ? titleMatch[1] : editor.state.doc.firstChild?.textContent || 'Untitled'
        const tags = [...text.matchAll(/@tag\s+\{([^}]+)\}/g)].map(m => m[1])

        await db.notes.update(activeNoteIdRef.current!, { content: editor.getHTML(), modified: new Date(), title, tags })

        // Re-scan line-by-line so each registry entry keeps its source line as
        // preview text. Parsed per line rather than over the whole document.
        const lines = text.split('\n')
        const entries: Omit<RegistryEntry, 'id'>[] = []
        for (const line of lines) {
          const regex = /@(def|section|ref|title)\s+\{([^}]+)\}/g
          let match
          while ((match = regex.exec(line)) !== null) {
            entries.push({ name: match[2], type: match[1] as RegistryEntry['type'], noteId: activeNoteIdRef.current!, lineContent: line.trim() })
          }
        }

        // Replace this note's registry rows wholesale (delete-then-add) so
        // removed annotations don't linger in the index.
        await db.registry.where('noteId').equals(activeNoteIdRef.current!).delete()
        if (entries.length) await db.registry.bulkAdd(entries)
      }, 500)
    },
  })

  // Keep the annotation extension's resolved-name set in sync with the registry,
  // then dispatch an empty transaction to force decorations to recompute so
  // @ref marks flip between resolved/unresolved styling.
  useEffect(() => {
    resolvedNames.clear()
    registryEntries?.forEach(e => resolvedNames.add(e.name))
    // While the demo is open, resolve its annotations from the in-memory set too.
    if (demoOpen) DEMO_REGISTRY.forEach(e => resolvedNames.add(e.name))
    if (editor) editor.view.dispatch(editor.state.tr)
  }, [registryEntries, editor, demoOpen])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Support both ⌘P (macOS) and Ctrl+P (Windows/Linux).
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); setPaletteOpen(true) }
      if (e.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    function onMouseDown() { setTableMenu(null) }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Cancel any pending autosave/hover timers if the app unmounts.
  useEffect(() => () => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    if (showTimeout.current) clearTimeout(showTimeout.current)
    if (dismissTimeout.current) clearTimeout(dismissTimeout.current)
  }, [])

  // First-run onboarding: on an empty database, show the ephemeral demo so a new
  // user sees the guide without a note being created. Runs once the editor exists
  // (showDemo needs it to set content); guarded against StrictMode reruns.
  useEffect(() => {
    if (!editor || seededRef.current) return
    seededRef.current = true
    db.notes.count().then(count => {
      if (count === 0) showDemo()
    })
  }, [editor])

  // Keeps the ref and state in sync together; avoids repeating the pair.
  // Activating any real note (or the list) also exits the ephemeral demo.
  function setActive(id: number | null) {
    activeNoteIdRef.current = id
    setActiveNoteId(id)
    setDemoOpen(false)
  }

  async function createNote() {
    const id = await db.notes.add({
      title: 'Untitled',
      content: '',
      tags: [],
      created: new Date(),
      modified: new Date(),
    }) as number
    setActive(id)
    // Clear the editor and drop the cursor in so the user can type immediately.
    editor?.chain().setContent('<p></p>').focus().run()
  }

  // Duplicate a note (content + tags) under a "… copy" title, and open the copy.
  async function duplicateNote(note: Note) {
    const copy = {
      title: note.title ? `${note.title} copy` : '',
      content: note.content,
      tags: [...note.tags],
      created: new Date(),
      modified: new Date(),
    }
    const id = await db.notes.add(copy) as number
    selectNote({ ...copy, id })
  }

  async function deleteNote(note: Note) {
    // Remove the note and its registry entries together so no orphan annotations linger.
    await db.notes.delete(note.id!)
    await db.registry.where('noteId').equals(note.id!).delete()
    if (activeNoteIdRef.current === note.id) {
      setActive(null)
      editor?.commands.setContent('<p></p>')
    }
  }

  // Navigate to a registry entry: load the note, open it, then scroll to the
  // annotation. `delay` is 300ms from the palette (setContent must finish
  // rendering new nodes) and 100ms from the preview popup (note often already
  // loaded).
  async function navigateToAnnotation(noteId: number, name: string, delay: number) {
    const note = await db.notes.get(noteId)
    if (!note) return
    selectNote(note)
    setTimeout(() => scrollToAnnotation(name), delay)
  }

  async function handleSelectEntry(entry: RegistryEntry) {
    await navigateToAnnotation(entry.noteId, entry.name, 300)
  }

  async function handlePreviewSelect(noteId: number, name: string) {
    setPreview(null)
    // Demo mode: the @def lives in the current doc, so just scroll to it.
    if (demoOpen) { scrollToAnnotation(name); return }
    await navigateToAnnotation(noteId, name, 100)
  }

  function selectNote(note: Note) {
    setActive(note.id!)
    editor?.commands.setContent(note.content || '<p></p>')
  }

  function backToList() {
    setActive(null)
    editor?.commands.setContent('<p></p>')
  }

  // Open the onboarding content as a throwaway preview: no note is created and
  // autosave no-ops (activeNoteIdRef stays null), so nothing is persisted.
  function showDemo() {
    setActive(null)
    setDemoOpen(true)
    editor?.commands.setContent(ONBOARDING_CONTENT)
  }

  // Find the @def declaration for `name` in the current doc and scroll it into
  // view. Only @def (not @ref) is targeted so navigation lands on the source.
  function scrollToAnnotation(name: string) {
    if (!editor) return
    const target = `@def {${name}}`
    let foundPos: number | null = null

    editor.state.doc.descendants((node, pos) => {
      if (foundPos !== null) return false
      if (node.isText && node.text?.includes(target)) {
        foundPos = pos + node.text.indexOf(target)
      }
    })

    if (foundPos !== null) {
      editor.chain().setTextSelection(foundPos).scrollIntoView().run()
    }
  }

  // Grace period before closing the preview, so the cursor can travel from the
  // annotation into the preview popup (which calls cancelDismiss on enter).
  function startDismiss() {
    dismissTimeout.current = setTimeout(() => setPreview(null), 700)
  }

  function cancelDismiss() {
    if (dismissTimeout.current) clearTimeout(dismissTimeout.current)
  }

  // Every @ref that points at `name`, with the source note title + line. Shared
  // by the @def hover preview and the click-triggered backlinks popover.
  async function fetchBacklinks(name: string) {
    const refs = await db.registry.where('name').equals(name).filter(e => e.type === 'ref').toArray()
    if (!refs.length) return []
    const ids = [...new Set(refs.map(r => r.noteId))]
    const notesById = new Map((await db.notes.bulkGet(ids)).map((n, i) => [ids[i], n] as const))
    return refs.map(r => ({ title: notesById.get(r.noteId)?.title ?? 'Untitled', line: r.lineContent, noteId: r.noteId, name }))
  }

  // Hover-preview state machine driven by mousemove over the editor. Three cases:
  //  - cursor left every annotation: cancel any pending show, start dismiss timer
  //  - cursor still over the same annotation: no-op (guarded by currentAnnotation)
  //  - cursor entered a new annotation: schedule a 200ms-delayed preview fetch
  function handleEditorMouseMove(e: React.MouseEvent) {
    const target = e.target as HTMLElement
    const isDef = target.classList.contains('annotation-def')
      || target.classList.contains('annotation-section')
      || target.classList.contains('annotation-title')
    const isRef = target.classList.contains('annotation-ref-resolved')

    if (!isDef && !isRef) {
      if (currentAnnotation.current !== null) {
        currentAnnotation.current = null
        if (showTimeout.current) clearTimeout(showTimeout.current)
        startDismiss()
      }
      return
    }

    const match = target.textContent?.match(/@(?:def|section|title|ref)\s+\{([^}]+)\}/)
    if (!match) return
    const name = match[1]

    // Cursor is back on an annotation, so cancel any in-flight dismiss.
    cancelDismiss()

    // Already hovering this annotation; preview is shown or pending, do nothing.
    if (currentAnnotation.current === name) return

    currentAnnotation.current = name
    if (showTimeout.current) clearTimeout(showTimeout.current)

    // Capture rect now; the async callback positions the popup from it.
    const rect = target.getBoundingClientRect()

    showTimeout.current = setTimeout(async () => {
      // Demo mode: resolve from the in-memory registry, never the DB. Only the
      // @ref preview is supported (what the onboarding text demonstrates).
      if (demoOpen) {
        const d = isRef && DEMO_REGISTRY.find(e => e.name === name)
        if (d) setPreview({ entries: [{ title: DEMO_TITLE, line: d.line, noteId: -1, name }], x: rect.left, y: rect.bottom })
        return
      }

      // Hovering a @ref: show where it's defined (the matching def/section/title).
      if (isRef) {
        const entry = await db.registry.where('name').equals(name)
          .filter(e => e.type === 'def' || e.type === 'section' || e.type === 'title').first()
        if (!entry) return
        const note = await db.notes.get(entry.noteId)
        setPreview({ entries: [{ title: note?.title ?? 'Untitled', line: entry.lineContent, noteId: entry.noteId, name }], x: rect.left, y: rect.bottom })
      }

      // Hovering a definition: show every @ref that points back at it.
      if (isDef) {
        const entries = await fetchBacklinks(name)
        if (entries.length) setPreview({ entries, heading: `Referenced by (${entries.length})`, x: rect.left, y: rect.bottom })
      }
    }, 200)
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (!editor?.isActive('table')) return
    e.preventDefault()
    setTableMenu({ x: e.clientX, y: e.clientY })
  }

  // The editor pane shows for a real note or the ephemeral demo; otherwise the
  // empty state. Drives layout (mobile two-view), the back bar, and the footer.
  const editorOpen = activeNoteId !== null || demoOpen

  return (
    <div className="k-app" data-view={editorOpen ? 'note' : 'list'}>
      <Sidebar activeId={activeNoteId} onSelect={selectNote} onDelete={deleteNote} onDuplicate={duplicateNote} onNew={createNote} onSearch={() => setPaletteOpen(true)} onHelp={showDemo} onSettings={() => setSettingsOpen(true)} />
      <div className="k-island k-editor">
        {editorOpen && (
          <div className="k-editor-bar">
            <button className="k-btn k-btn-ghost k-mobile-back" onClick={backToList}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m15 18-6-6 6-6" />
              </svg>
              Notes
            </button>
          </div>
        )}
        {editorOpen ? (
          <div className="k-editor-scroll" onMouseMove={handleEditorMouseMove} onContextMenu={handleContextMenu}>
            <div className="k-editor-inner">
              <EditorContent editor={editor} />
            </div>
          </div>
        ) : (
          <div className="k-editor-empty">
            <p>No note selected</p>
          </div>
        )}
        {editorOpen && editor && (
          <div className="k-editor-foot">
            <EditorToolbar editor={editor} />
          </div>
        )}
      </div>

      {/* Fixed overlays live at the app root, not inside .k-editor — on mobile the
          editor island is display:none in list view, which would hide them. */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectNote={selectNote}
        onSelectEntry={handleSelectEntry}
      />
      {settingsOpen && (
        <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setSettingsOpen(false)} />
      )}
      {preview && (
        <AnnotationPreview
          entries={preview.entries}
          heading={preview.heading}
          x={preview.x}
          y={preview.y}
          onSelect={handlePreviewSelect}
          onMouseEnter={cancelDismiss}
          onMouseLeave={() => setPreview(null)}
        />
      )}
      {tableMenu && editor && (
        <TableContextMenu x={tableMenu.x} y={tableMenu.y} editor={editor} onClose={() => setTableMenu(null)} />
      )}
    </div>
  )
}
