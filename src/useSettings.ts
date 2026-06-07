// Persisted user settings. Stored in localStorage (no Dexie migration needed)
// and applied to <html> as data-theme so the CSS token overrides take effect.
import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type AnnoType = 'title' | 'section' | 'def' | 'ref' | 'tag'
export interface Settings {
  theme: Theme
  colors: Record<AnnoType, string>
}

const KEY = 'kernel-settings'
// Mirror the CSS token defaults: when a color is left at its default we clear the
// inline override so the stylesheet (incl. dark-mode brightening) keeps governing.
export const DEFAULT_COLORS: Record<AnnoType, string> = {
  title: '#dc2626', section: '#d97706', def: '#16a34a', ref: '#2563eb', tag: '#6366f1',
}
const DEFAULTS: Settings = { theme: 'system', colors: DEFAULT_COLORS }

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...DEFAULTS, ...saved, colors: { ...DEFAULT_COLORS, ...saved.colors } }
  } catch {
    return DEFAULTS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  // Resolve theme to light/dark and apply it; for "system", follow the OS and
  // live-update when it changes.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    if (settings.theme !== 'system') return
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings.theme])

  // Apply annotation/tag colors as inline CSS vars on <html>. Colors left at
  // their default are cleared so the stylesheet (incl. dark mode) governs them.
  useEffect(() => {
    const root = document.documentElement
    for (const key of Object.keys(DEFAULT_COLORS) as AnnoType[]) {
      const value = settings.colors[key]
      if (value === DEFAULT_COLORS[key]) root.style.removeProperty(`--anno-${key}`)
      else root.style.setProperty(`--anno-${key}`, value)
    }
  }, [settings.colors])

  return { settings, setSettings }
}
