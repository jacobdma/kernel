// Wires the '/' suggestion trigger to the COMMANDS registry and renders the
// SlashMenu popup. COMMANDS is populated by App.tsx from the command extensions.
import { Extension } from '@tiptap/core'
import type { Editor, Range } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import SlashMenu from '../SlashMenu'
import type { SlashCommand } from '../SlashMenu'

export const COMMANDS: SlashCommand[] = []

export const SlashCommands = Extension.create({
  name: 'slashCommands',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        items: ({ query }: { query: string }) =>
        COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase())),
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashCommand }) => {
          props.command({ editor, range })
        },
        render: () => {
          let renderer: ReactRenderer<any>
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
            onKeyDown: (props: any) => (renderer.ref as any)?.onKeyDown(props) ?? false,
            onExit() { popup.remove(); renderer.destroy() },
          }
        },
      }),
    ]
  },
})
