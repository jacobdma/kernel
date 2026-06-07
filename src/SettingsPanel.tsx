// Settings modal: theme control + tag/annotation color pickers.
import type { Settings, Theme, AnnoType } from './useSettings'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

// Shared swatch palette; includes the annotation defaults so a default config
// shows the matching swatch selected.
const PALETTE = ['#dc2626', '#d97706', '#16a34a', '#2563eb', '#6366f1', '#0d9488', '#7c3aed', '#e11d48']

const COLOR_FIELDS: { key: AnnoType; label: string }[] = [
  { key: 'tag', label: 'Tags' },
  { key: 'title', label: 'Title' },
  { key: 'section', label: 'Section' },
  { key: 'def', label: 'Definition' },
  { key: 'ref', label: 'Reference' },
]

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

export default function SettingsPanel({ settings, onChange, onClose }: Props) {
  return (
    <div className="k-confirm-scrim" onClick={onClose}>
      <div className="k-settings" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="k-settings-head">
          <h2 className="k-settings-title">Settings</h2>
          <button className="k-iconbtn" aria-label="Close settings" onClick={onClose}>✕</button>
        </div>

        <div className="k-settings-body">
          <div className="k-settings-row">
            <span className="k-settings-label">Theme</span>
            <div className="k-segmented">
              {THEMES.map(t => (
                <button
                  key={t.value}
                  className={`k-seg ${settings.theme === t.value ? 'active' : ''}`}
                  onClick={() => onChange({ ...settings, theme: t.value })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="k-settings-sub">Colors</div>
          {COLOR_FIELDS.map(field => (
            <div className="k-settings-row" key={field.key}>
              <span className="k-settings-label">{field.label}</span>
              <div className="k-swatches">
                {PALETTE.map(color => (
                  <button
                    key={color}
                    className={`k-swatch ${settings.colors[field.key] === color ? 'sel' : ''}`}
                    style={{ background: color }}
                    aria-label={`${field.label}: ${color}`}
                    onClick={() => onChange({ ...settings, colors: { ...settings.colors, [field.key]: color } })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
