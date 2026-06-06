// TipTap extension that decorates @title/@section/@def/@ref/@tag annotations
// inline. @ref marks are styled resolved or unresolved depending on whether the
// referenced name exists in `resolvedNames` (kept in sync with the registry by App).
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

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
              const regex = /@(title|section|def|ref|tag)\s+\{([^}]+)\}/g
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
