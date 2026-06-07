// Shows placeholder text ("New note") over an empty editor. Implemented as a
// ProseMirror node decoration (not real content) so it never gets saved — the
// CSS in index.css renders `data-placeholder` via ::before on the `.is-empty` node.
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const TEXT = 'New note'

export const Placeholder = Extension.create({
  name: 'placeholder',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('placeholder'),
        props: {
          decorations(state) {
            const { doc } = state
            const first = doc.firstChild
            const isEmpty = doc.childCount === 1 && !!first?.isTextblock && first.content.size === 0
            if (!isEmpty) return null
            return DecorationSet.create(doc, [
              Decoration.node(0, first!.nodeSize, { class: 'is-empty', 'data-placeholder': TEXT }),
            ])
          },
        },
      }),
    ]
  },
})
