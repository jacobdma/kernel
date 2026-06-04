import { forwardRef, useImperativeHandle, useState } from 'react'

export type SlashCommand = {
  label: string
  command: (props: { editor: any; range: any }) => void
}

export interface SlashMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const SlashMenu = forwardRef<SlashMenuHandle, { items: SlashCommand[]; command: (item: SlashCommand) => void }>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0)

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }) {
        if (event.key === 'ArrowUp') { setSelected(s => Math.max(0, s - 1)); return true }
        if (event.key === 'ArrowDown') { setSelected(s => Math.min(items.length - 1, s + 1)); return true }
        if (event.key === 'Enter') { if (items[selected]) command(items[selected]); return true }
        return false
      }
    }))

    return (
      <div className="bg-white border border-gray-200 rounded shadow-lg p-1 min-w-32">
        {items.length === 0 && <p className="text-xs text-gray-400 px-2 py-1">No commands</p>}
        {items.map((item, i) => (
          <button key={item.label} onClick={() => command(item)}
            className={`block w-full text-left text-sm px-2 py-1 rounded ${i === selected ? 'bg-gray-100' : ''}`}>
            {item.label}
          </button>
        ))}
      </div>
    )
  }
)

export default SlashMenu
