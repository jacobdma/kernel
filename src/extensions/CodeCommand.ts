import type { SlashCommand } from '../SlashMenu'

export const CodeCommand: SlashCommand = {
  label: '/code', shortcut: '```',
  command({ editor, range }) {
    editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
  },
}
