import { forwardRef, useImperativeHandle, useState } from 'react'

export type SlashCommand = {
  label: string
  shortcut?: string
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
      <div className="k-slash">
        {items.length === 0 && <p className="k-slash-empty">No commands</p>}
        {items.map((item, i) => (
        <button key={item.label} onClick={() => command(item)}
            className={`k-slash-item ${i === selected ? 'sel' : ''}`}>
            <span>{item.label}</span>
            {item.shortcut && <span className="k-slash-sc">{item.shortcut}</span>}
        </button>
        ))}
      </div>
    )
  }
)

export default SlashMenu
