// Wires the '@' suggestion trigger to the annotation-type list and renders the
// SlashMenu popup — the @-annotation analogue of SlashCommands.
import { Extension } from '@tiptap/core'
import type { Editor, Range } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import SlashMenu from '../SlashMenu'
import type { SlashCommand, SlashMenuHandle } from '../SlashMenu'
import { ANNOTATIONS } from './AnnotationCommand'

export const AnnotationSuggest = Extension.create({
  name: 'annotationSuggest',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '@',
        items: ({ query }: { query: string }) =>
          ANNOTATIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase())),
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashCommand }) => {
          props.command({ editor, range })
        },
        render: () => {
          let renderer: ReactRenderer<SlashMenuHandle>
          let popup: HTMLDivElement
          return {
            onStart(props: any) {
              popup = Object.assign(document.createElement('div'), { style: 'position:fixed;z-index:50' })
              document.body.appendChild(popup)
              renderer = new ReactRenderer(SlashMenu, { props, editor: props.editor })
              popup.appendChild(renderer.element)
              const rect = props.clientRect?.()
              if (rect) { popup.style.top = `${rect.bottom + 4}px`; popup.style.left = `${rect.left}px` }
            },
            onUpdate(props: any) {
              renderer.updateProps(props)
              const rect = props.clientRect?.()
              if (rect) { popup.style.top = `${rect.bottom + 4}px`; popup.style.left = `${rect.left}px` }
            },
            onKeyDown: (props: any) => renderer.ref?.onKeyDown(props) ?? false,
            onExit() { popup.remove(); renderer.destroy() },
          }
        },
      }),
    ]
  },
})
