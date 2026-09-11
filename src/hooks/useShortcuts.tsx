import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getActiveEditor } from '@/lib/editorRegistry'
import {
  LINE_ACTIONS,
  isShortcutCaptureLocked,
  loadShortcuts,
  matchShortcutAction,
  saveShortcuts,
  setShortcutCaptureLock,
  type ShortcutAction,
  type ShortcutBindings,
} from '@/lib/shortcuts'

type ShortcutsContextValue = {
  bindings: ShortcutBindings
  setBinding: (action: ShortcutAction, binding: string) => void
  capturing: boolean
  setCapturing: (value: boolean) => void
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null)

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const [bindings, setBindings] = useState<ShortcutBindings>(loadShortcuts)
  const [capturing, setCapturingState] = useState(false)
  const setCapturing = useCallback((value: boolean) => {
    setShortcutCaptureLock(value)
    setCapturingState(value)
  }, [])

  const setBinding = useCallback((action: ShortcutAction, binding: string) => {
    setBindings((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next) as ShortcutAction[]) {
        if (key !== action && next[key] === binding) next[key] = ''
      }
      next[action] = binding
      saveShortcuts(next)
      return next
    })
  }, [])

  return (
    <ShortcutsContext.Provider value={{ bindings, setBinding, capturing, setCapturing }}>
      {children}
    </ShortcutsContext.Provider>
  )
}

export function useShortcuts() {
  const ctx = useContext(ShortcutsContext)
  if (!ctx) throw new Error('useShortcuts must be used within ShortcutsProvider')
  return ctx
}

const LINE_ACTION_SET = new Set<string>(LINE_ACTIONS)

type ShortcutListenerOptions = {
  onCreateCard: () => void
  onSearch: () => void
}

export function useShortcutListener({ onCreateCard, onSearch }: ShortcutListenerOptions) {
  const { bindings, capturing } = useShortcuts()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (capturing || isShortcutCaptureLocked()) return
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-slot="dialog-content"], [data-slot="alert-dialog-content"]')) return

      const action = matchShortcutAction(bindings, event)
      if (!action) return

      if (LINE_ACTION_SET.has(action)) {
        const editor = getActiveEditor()
        if (!editor?.isFocused) return
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        if (action === 'moveLineUp') editor.commands.moveLineUp()
        if (action === 'moveLineDown') editor.commands.moveLineDown()
        if (action === 'duplicateLineDown') editor.commands.duplicateLineDown()
        if (action === 'deleteLine') editor.commands.deleteLine()
        if (action === 'insertLineBelow') editor.commands.insertLineBelow()
        if (action === 'insertLineAbove') editor.commands.insertLineAbove()
        if (action === 'goToLineStart') editor.commands.goToLineStart()
        if (action === 'goToLineEnd') editor.commands.goToLineEnd()
        if (action === 'selectToLineStart') editor.commands.selectToLineStart()
        if (action === 'selectToLineEnd') editor.commands.selectToLineEnd()
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      if (action === 'createCard') onCreateCard()
      if (action === 'search') onSearch()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [bindings, capturing, onCreateCard, onSearch])
}
