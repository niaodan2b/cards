import { useState, useSyncExternalStore } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authDialogStore, cancelTokenPrompt, submitToken } from '@/lib/auth'

export function AuthDialog() {
  const open = useSyncExternalStore(authDialogStore.subscribe, authDialogStore.getSnapshot)
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    submitToken(trimmed)
    setValue('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      cancelTokenPrompt()
      setValue('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>访问令牌</DialogTitle>
        </DialogHeader>
        <Input
          type="password"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button disabled={!value.trim()} onClick={handleSubmit}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
