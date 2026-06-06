// Slash commands for text formatting: headings (/h1–/h3), /bold, /italic.
import type { SlashCommand } from '../SlashMenu'

export const FormattingCommands: SlashCommand[] = [
  {
    label: '/h1', shortcut: '#',
    command({ editor, range }) {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    label: '/h2', shortcut: '##',
    command({ editor, range }) {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    label: '/h3', shortcut: '###',
    command({ editor, range }) {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    label: '/bold', shortcut: '⌘B',
    command({ editor, range }) {
      editor.chain().focus().deleteRange(range).toggleBold().run()
    },
  },
  {
    label: '/italic', shortcut: '⌘I',
    command({ editor, range }) {
      editor.chain().focus().deleteRange(range).toggleItalic().run()
    },
  },
]
