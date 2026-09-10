import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useShortcuts } from '@/hooks/useShortcuts'
import {
  SHORTCUT_ACTIONS,
  SHORTCUT_LABELS,
  eventToBinding,
  formatBinding,
  isUsableBinding,
  type ShortcutAction,
} from '@/lib/shortcuts'
import { cn } from '@/lib/utils'

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { bindings, setBinding, setCapturing } = useShortcuts()
  const [capturingAction, setCapturingAction] = useState<ShortcutAction | null>(null)

  useEffect(() => {
    if (!open) setCapturingAction(null)
  }, [open])

  useEffect(() => {
    if (!capturingAction) {
      setCapturing(false)
      return
    }
    setCapturing(true)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        setCapturingAction(null)
        return
      }
      const binding = eventToBinding(event)
      if (!binding || !isUsableBinding(binding)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      setBinding(capturingAction, binding)
      setCapturingAction(null)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      setCapturing(false)
    }
  }, [capturingAction, setBinding, setCapturing])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setCapturingAction(null)
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        <div className="grid gap-1">
          {SHORTCUT_ACTIONS.map((action) => {
            const recording = capturingAction === action
            return (
              <div key={action} className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm">{SHORTCUT_LABELS[action]}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCapturing(true)
                    setCapturingAction(action)
                  }}
                  className={cn(
                    'h-7 min-w-24 shrink-0 rounded-md border px-2 font-mono text-xs whitespace-nowrap tabular-nums outline-none',
                    recording
                      ? 'border-ring ring-3 ring-ring/50'
                      : 'border-input hover:bg-muted',
                  )}
                >
                  {recording ? '' : formatBinding(bindings[action])}
                </button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
