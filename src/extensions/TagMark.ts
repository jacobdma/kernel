import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const TagMark = Extension.create({
  name: 'tagMark',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tagMark'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = []
            const tagRegex = /#[\w]+/g

            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return
              let match
              while ((match = tagRegex.exec(node.text)) !== null) {
                decorations.push(
                  Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                    class: 'tag-mark',
                  })
                )
              }
            })

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
