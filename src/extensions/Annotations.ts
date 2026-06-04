import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const ANNOTATION_REGEX = /@(title|section|def|ref|tag)\s+\{([^}]+)\}/g
export const resolvedNames = new Set<string>()

export const Annotations = Extension.create({
  name: 'annotations',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('annotations'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = []
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return
              const regex = new RegExp(ANNOTATION_REGEX.source, 'g')
              let match
              while ((match = regex.exec(node.text)) !== null) {
                const [full, type, name] = match
                const refClass = type === 'ref'
                  ? resolvedNames.has(name) ? 'annotation-ref-resolved' : 'annotation-ref-unresolved'
                  : `annotation-${type}`
                decorations.push(
                  Decoration.inline(pos + match.index, pos + match.index + full.length, {
                    class: `annotation ${refClass}`,
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
