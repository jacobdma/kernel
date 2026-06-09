// Wires the '@' suggestion trigger to the two-level AnnotationMenu. Level 1 is
// the annotation types (filtered by what's typed after '@'); the menu drives
// Level 2 (ref names) itself and calls back with the {type, name} to insert.
import { Extension } from '@tiptap/core'
import type { Editor, Range } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import AnnotationMenu from '../AnnotationMenu'
import type { AnnotationMenuHandle } from '../AnnotationMenu'
import { ANNO_TYPES, insertAnnotation } from './AnnotationCommand'
import type { AnnoType } from './AnnotationCommand'

export const AnnotationSuggest = Extension.create({
  name: 'annotationSuggest',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        // Distinct key — @tiptap/suggestion shares one default pluginKey, so
        // without this the '@' plugin collides with SlashCommands' '/' plugin.
        pluginKey: new PluginKey('annotationSuggest'),
        char: '@',
        items: ({ query }: { query: string }) =>
          ANNO_TYPES.filter(t => t.includes(query.toLowerCase())),
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: { type: AnnoType; name?: string } }) => {
          insertAnnotation(editor, range, props.type, props.name)
        },
        render: () => {
          let renderer: ReactRenderer<AnnotationMenuHandle>
          let popup: HTMLDivElement
          const place = (props: any) => {
            const rect = props.clientRect?.()
            if (rect) { popup.style.top = `${rect.bottom + 4}px`; popup.style.left = `${rect.left}px` }
          }
          return {
            onStart(props: any) {
              popup = Object.assign(document.createElement('div'), { style: 'position:fixed;z-index:50' })
              document.body.appendChild(popup)
              renderer = new ReactRenderer(AnnotationMenu, { props, editor: props.editor })
              popup.appendChild(renderer.element)
              place(props)
            },
            onUpdate(props: any) { renderer.updateProps(props); place(props) },
            onKeyDown: (props: any) => renderer.ref?.onKeyDown(props) ?? false,
            onExit() { popup.remove(); renderer.destroy() },
          }
        },
      }),
    ]
  },
})
