import { useEffect } from 'react'
import { useRef, useState } from 'react'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

import { Annotations } from './extensions/Annotations'
import { resolvedNames } from './extensions/Annotations'
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

COMMANDS.length = 0
COMMANDS.push(TodoCommand, CodeCommand, TableCommand, ...FormattingCommands)
console.log(COMMANDS)

export default function App() {
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null)
  const activeNoteIdRef = useRef<number | null>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const registryEntries = useLiveQuery(() => db.registry.toArray(), [])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [preview, setPreview] = useState<{ entries: { title: string; line: string; noteId: number; name: string }[]; x: number; y: number } | null>(null)
  const dismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentAnnotation = useRef<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit, 
      TaskList, 
      TaskItem.configure({ nested: true }), 
      SlashCommands, 
      Annotations, 
      Link,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '<p>Start typing...</p>',
    onUpdate({ editor }) {
      if (!activeNoteIdRef.current) return
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(async () => {
        const text = editor.getText()

        const titleMatch = text.match(/@title\s+\{([^}]+)\}/)
        const title = titleMatch ? titleMatch[1] : editor.state.doc.firstChild?.textContent || 'Untitled'
        const tags = [...text.matchAll(/@tag\s+\{([^}]+)\}/g)].map(m => m[1])

        await db.notes.update(activeNoteIdRef.current!, { content: editor.getHTML(), modified: new Date(), title, tags })

        const lines = text.split('\n')
        const entries: Omit<RegistryEntry, 'id'>[] = []
        for (const line of lines) {
          const regex = /@(def|section|ref|title})\s+\{([^}]+)\}/g
          let match
          while ((match = regex.exec(line)) !== null) {
            entries.push({ name: match[2], type: match[1] as 'def' | 'section', noteId: activeNoteIdRef.current!, lineContent: line.trim() })
          }
        }

        await db.registry.where('noteId').equals(activeNoteIdRef.current!).delete()
        if (entries.length) await db.registry.bulkAdd(entries)
      }, 500)
    },
  })

  useEffect(() => {
    resolvedNames.clear()
    registryEntries?.forEach(e => resolvedNames.add(e.name))
    if (editor) editor.view.dispatch(editor.state.tr)
  }, [registryEntries, editor])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.key === 'p') { e.preventDefault(); setPaletteOpen(true) }
      if (e.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function createNote() {
    const id = await db.notes.add({
      title: 'Untitled',
      content: '',
      tags: [],
      created: new Date(),
      modified: new Date(),
    })
    activeNoteIdRef.current = id as number
    setActiveNoteId(id as number)
    editor?.commands.setContent('<p></p>')
  }

  async function deleteNote(note: Note) {
    await db.notes.delete(note.id!)
    if (activeNoteIdRef.current === note.id) {
      activeNoteIdRef.current = null
      setActiveNoteId(null)
      editor?.commands.setContent('<p></p>')
    }
  }

  async function handleSelectEntry(entry: RegistryEntry) {
    const note = await db.notes.get(entry.noteId)
    if (!note) return
    selectNote(note)
    setTimeout(() => scrollToAnnotation(entry.name), 300)
  }

  async function handlePreviewSelect(noteId: number, name: string) {
    const note = await db.notes.get(noteId)
    if (!note) return
    selectNote(note)
    setTimeout(() => scrollToAnnotation(name), 100)
    setPreview(null)
  }

  function selectNote(note: Note) {
    activeNoteIdRef.current = note.id!
    setActiveNoteId(note.id!)
    editor?.commands.setContent(note.content || '<p></p>')
  }

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

  function handleEditorClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.classList.contains('annotation-ref-resolved')) return
  }

  function startDismiss() {
    dismissTimeout.current = setTimeout(() => setPreview(null), 700)
  }

  function cancelDismiss() {
    if (dismissTimeout.current) clearTimeout(dismissTimeout.current)
  }

  function handleEditorMouseMove(e: React.MouseEvent) {
    const target = e.target as HTMLElement
    const isDef = target.classList.contains('annotation-def')
    const isRef = target.classList.contains('annotation-ref-resolved')

    if (!isDef && !isRef) {
      if (currentAnnotation.current !== null) {
        currentAnnotation.current = null
        if (showTimeout.current) clearTimeout(showTimeout.current)
        startDismiss()
      }
      return
    }

    const match = target.textContent?.match(/@(?:def|ref)\s+\{([^}]+)\}/)
    if (!match) return
    const name = match[1]

    cancelDismiss()

    if (currentAnnotation.current === name) return

    currentAnnotation.current = name
    if (showTimeout.current) clearTimeout(showTimeout.current)

    const rect = target.getBoundingClientRect()

    showTimeout.current = setTimeout(async () => {
      if (isRef) {
        const entry = await db.registry.where('name').equals(name)
          .filter(e => e.type === 'def' || e.type === 'section' || e.type === 'title').first()
        if (!entry) return
        const note = await db.notes.get(entry.noteId)
        setPreview({ entries: [{ title: note?.title ?? 'Untitled', line: entry.lineContent, noteId: entry.noteId, name }], x: rect.left, y: rect.bottom })
      }

      if (isDef) {
        const refs = await db.registry.where('name').equals(name).filter(e => e.type === 'ref').toArray()
        const entries = await Promise.all(refs.map(async r => {
          const note = await db.notes.get(r.noteId)
          return { title: note?.title ?? 'Untitled', line: r.lineContent, noteId: r.noteId, name }
        }))
        if (!entries.length) return
        setPreview({ entries, x: rect.left, y: rect.bottom })
      }
    }, 200)
  }

  return (
    <div className="flex h-screen">
      <Sidebar activeId={activeNoteId} onSelect={selectNote} onDelete={deleteNote} onNew={createNote} />
      <div className="flex-1 p-8">
        {activeNoteId === null ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <p className="text-sm mb-3">No note selected</p>
          </div>
        ) : (
          <div onClick={handleEditorClick} onMouseMove={handleEditorMouseMove}>
            <EditorContent editor={editor} />
          </div>
        )}
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onSelectNote={selectNote}
          onSelectEntry={handleSelectEntry}
        />
        {preview && (
          <AnnotationPreview
            entries={preview.entries}
            x={preview.x}
            y={preview.y}
            onSelect={handlePreviewSelect}
            onMouseEnter={cancelDismiss}
            onMouseLeave={() => setPreview(null)}
          />
        )}
      </div>
    </div>
  )
}
