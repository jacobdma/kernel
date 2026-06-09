// Annotation types offered by the '@' menu, plus the insert helper. Picking a
// type inserts the scaffold `@<type> {}` (cursor inside the braces); picking a
// name for `ref` inserts the completed `@ref {name}`.
import type { Editor, Range } from '@tiptap/core'

export type AnnoType = 'title' | 'section' | 'def' | 'ref' | 'tag'
export const ANNO_TYPES: AnnoType[] = ['title', 'section', 'def', 'ref', 'tag']

export function insertAnnotation(editor: Editor, range: Range, type: AnnoType, name?: string) {
  if (type === 'ref' && name) {
    editor.chain().focus().deleteRange(range).insertContent(`@ref {${name}}`).run()
    return
  }
  editor.chain().focus().deleteRange(range).insertContent(`@${type} {}`).run()
  // Drop the cursor between the braces so the name can be typed immediately.
  editor.commands.setTextSelection(editor.state.selection.from - 1)
}
