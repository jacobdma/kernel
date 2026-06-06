// Slash command: /table inserts a 3x3 table (no header row).
import type { SlashCommand } from '../SlashMenu'

export const TableCommand: SlashCommand = {
  label: '/table',
  command({ editor, range }) {
    editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run()
  },
}
