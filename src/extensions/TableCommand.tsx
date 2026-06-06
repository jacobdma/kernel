import type { SlashCommand } from '../SlashMenu'

export const TableCommand: SlashCommand = {
  label: '/table',
  command({ editor, range }) {
    editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run()
  },
}
