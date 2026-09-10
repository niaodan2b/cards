export const SHORTCUT_ACTIONS = [
  'createCard',
  'search',
  'moveLineUp',
  'moveLineDown',
  'duplicateLineDown',
  'deleteLine',
  'insertLineBelow',
  'insertLineAbove',
] as const

export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number]

export type ShortcutBindings = Record<ShortcutAction, string>

export const LINE_ACTIONS = [
  'moveLineUp',
  'moveLineDown',
  'duplicateLineDown',
  'deleteLine',
  'insertLineBelow',
  'insertLineAbove',
] as const satisfies readonly ShortcutAction[]

export const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  createCard: '新增卡片',
  search: '全局搜索',
  moveLineUp: '当前行上移',
  moveLineDown: '当前行下移',
  duplicateLineDown: '向下复制当前行',
  deleteLine: '删除当前行',
  insertLineBelow: '向下插入行',
  insertLineAbove: '向上插入行',
}

export const DEFAULT_SHORTCUTS: ShortcutBindings = {
  createCard: 'Mod+KeyN',
  search: 'Mod+KeyF',
  moveLineUp: 'Alt+ArrowUp',
  moveLineDown: 'Alt+ArrowDown',
  duplicateLineDown: 'Alt+Shift+ArrowDown',
  deleteLine: 'Mod+Shift+KeyK',
  insertLineBelow: 'Mod+Enter',
  insertLineAbove: 'Mod+Shift+Enter',
}

export const SHORTCUTS_STORAGE_KEY = 'cards.shortcuts'

const CODE_LABELS: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Enter: 'Enter',
  Space: 'Space',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Escape: 'Esc',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`',
}

function isModifierCode(code: string) {
  return (
    code.startsWith('Meta') ||
    code.startsWith('Control') ||
    code.startsWith('Alt') ||
    code.startsWith('Shift') ||
    code === 'OSLeft' ||
    code === 'OSRight'
  )
}

export function isMacPlatform() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
}

function codeLabel(code: string) {
  if (CODE_LABELS[code]) return CODE_LABELS[code]
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return code.slice(6)
  return code
}

export function eventToBinding(event: KeyboardEvent): string | null {
  if (event.isComposing) return null
  if (isModifierCode(event.code)) return null
  const mac = isMacPlatform()
  const parts: string[] = []
  if (mac ? event.metaKey : event.ctrlKey) parts.push('Mod')
  if (mac && event.ctrlKey) parts.push('Ctrl')
  if (!mac && event.metaKey) parts.push('Meta')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  parts.push(event.code)
  return parts.join('+')
}

export function isUsableBinding(binding: string) {
  const mods = binding.split('+').slice(0, -1)
  return mods.includes('Mod') || mods.includes('Ctrl') || mods.includes('Alt') || mods.includes('Meta')
}

export function formatBinding(binding: string, mac = isMacPlatform()) {
  if (!binding) return ''
  const parts = binding.split('+')
  const code = parts[parts.length - 1] ?? ''
  const mods = parts.slice(0, -1)
  const key = codeLabel(code)
  if (mac) {
    let label = ''
    if (mods.includes('Ctrl')) label += '⌃'
    if (mods.includes('Alt')) label += '⌥'
    if (mods.includes('Shift')) label += '⇧'
    if (mods.includes('Mod') || mods.includes('Meta')) label += '⌘'
    return label + key
  }
  const labels: string[] = []
  if (mods.includes('Mod') || mods.includes('Ctrl')) labels.push('Ctrl')
  if (mods.includes('Meta')) labels.push('Win')
  if (mods.includes('Alt')) labels.push('Alt')
  if (mods.includes('Shift')) labels.push('Shift')
  labels.push(key)
  return labels.join('+')
}

export function matchShortcutAction(bindings: ShortcutBindings, event: KeyboardEvent): ShortcutAction | null {
  const current = eventToBinding(event)
  if (!current) return null
  for (const action of SHORTCUT_ACTIONS) {
    if (bindings[action] && bindings[action] === current) return action
  }
  return null
}

export function loadShortcuts(): ShortcutBindings {
  const fallback = { ...DEFAULT_SHORTCUTS }
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<ShortcutBindings>
    for (const action of SHORTCUT_ACTIONS) {
      if (typeof parsed[action] === 'string') fallback[action] = parsed[action]
    }
    return fallback
  } catch {
    return fallback
  }
}

export function saveShortcuts(bindings: ShortcutBindings) {
  localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(bindings))
}

let captureLock = false

export function setShortcutCaptureLock(value: boolean) {
  captureLock = value
}

export function isShortcutCaptureLocked() {
  return captureLock
}
