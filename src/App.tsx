import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { SlashCommands, COMMANDS } from './extensions/SlashCommands'
import { TodoCommand } from './extensions/TodoCommand'
import { CodeCommand } from './extensions/CodeCommand'
import { FormattingCommands } from './extensions/FormattingCommands'
import { useRef, useState } from 'react'
import { db } from './db'
import type { Note } from './db'
import Sidebar from './Sidebar'

COMMANDS.length = 0
COMMANDS.push(TodoCommand, CodeCommand, ...FormattingCommands)
console.log(COMMANDS)

export default function App() {
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null)
  const activeNoteIdRef = useRef<number | null>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true }), SlashCommands],
    content: '<p>Start typing...</p>',
    onUpdate({ editor }) {
      if (!activeNoteIdRef.current) return
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      const title = editor.state.doc.firstChild?.textContent || 'Untitled'
      saveTimeout.current = setTimeout(() => {
        db.notes.update(activeNoteIdRef.current!, {
          title,
          content: editor.getHTML(),
          modified: new Date(),
        })
      }, 500)
    },
  })

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

  function selectNote(note: Note) {
    activeNoteIdRef.current = note.id!
    setActiveNoteId(note.id!)
    editor?.commands.setContent(note.content || '<p></p>')
  }

  return (
    <div className="flex h-screen">
      <Sidebar activeId={activeNoteId} onSelect={selectNote} onDelete={deleteNote} />
      <div className="flex-1 p-8">
        <button onClick={createNote} className="mb-4 px-3 py-1 bg-black text-white text-sm rounded">
          New Note
        </button>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
