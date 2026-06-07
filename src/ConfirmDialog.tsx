// Centered confirmation modal shown before a destructive action (note delete).
interface Props {
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  return (
    <div className="k-confirm-scrim" onClick={onCancel}>
      <div className="k-confirm" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <p className="k-confirm-msg">{message}</p>
        <div className="k-confirm-actions">
          <button className="k-btn k-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="k-btn k-btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
