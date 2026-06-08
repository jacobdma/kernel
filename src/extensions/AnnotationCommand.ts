// The five annotation types offered by the '@' autocomplete. Each inserts the
// scaffold `@<type> {}` and leaves the cursor inside the braces. Reuses the
// SlashCommand shape + SlashMenu so the popup matches the '/' command menu.
import type { Editor, Range } from '@tiptap/core'
import type { SlashCommand } from '../SlashMenu'

const TYPES = ['title', 'section', 'def', 'ref', 'tag'] as const

function insertAnnotation(editor: Editor, range: Range, type: string) {
  editor.chain().focus().deleteRange(range).insertContent(`@${type} {}`).run()
  // Drop the cursor between the braces so the name can be typed immediately.
  editor.commands.setTextSelection(editor.state.selection.from - 1)
}

export const ANNOTATIONS: SlashCommand[] = TYPES.map(type => ({
  label: `@${type}`,
  command: ({ editor, range }) => insertAnnotation(editor, range, type),
}))
