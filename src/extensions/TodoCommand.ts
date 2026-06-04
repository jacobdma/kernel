import type { SlashCommand } from '../SlashMenu'

export const TodoCommand: SlashCommand = {
  label: '/todo',
  command({ editor, range }) {
    editor.chain().focus().deleteRange(range).toggleTaskList().run()
  },
}
