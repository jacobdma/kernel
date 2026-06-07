// Slash commands for text formatting: headings (/h1–/h3), /bold, /italic.
import type { SlashCommand } from '../SlashMenu'
import type { Editor, Range } from '@tiptap/core'

// A function that receives a TipTap chain and returns it after adding steps.
type ChainFn = (c: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>

// Factory shared by all formatting commands: deletes the slash trigger text,
// applies the given chain step, and calls .run().
function fmt(label: string, shortcut: string, apply: ChainFn): SlashCommand {
  return {
    label, shortcut,
    command({ editor, range }: { editor: Editor; range: Range }) {
      apply(editor.chain().focus().deleteRange(range)).run()
    },
  }
}

export const FormattingCommands: SlashCommand[] = [
  fmt('/h1', '#',   c => c.setHeading({ level: 1 })),
  fmt('/h2', '##',  c => c.setHeading({ level: 2 })),
  fmt('/h3', '###', c => c.setHeading({ level: 3 })),
  fmt('/bold',   '⌘B', c => c.toggleBold()),
  fmt('/italic', '⌘I', c => c.toggleItalic()),
]
