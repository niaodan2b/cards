import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StarRating } from '@/components/StarRating'
import { useUpdateCardMeta } from '@/hooks/useCards'
import type { Card } from '@/lib/types'

type EditCardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: Card
}

export function EditCardDialog({ open, onOpenChange, card }: EditCardDialogProps) {
  const [title, setTitle] = useState(card.title)
  const [level, setLevel] = useState(card.level)
  const [error, setError] = useState<string | null>(null)
  const updateMeta = useUpdateCardMeta()

  useEffect(() => {
    if (!open) return
    setTitle(card.title)
    setLevel(card.level)
    setError(null)
  }, [open, card.title, card.level])

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('请填写标题')
      return
    }
    try {
      await updateMeta.mutateAsync({ id: card.id, title: trimmed, level })
      onOpenChange(false)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑卡片</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-card-title">标题</Label>
            <Input
              id="edit-card-title"
              value={title}
              autoFocus
              onChange={(e) => {
                setTitle(e.target.value)
                setError(null)
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>等级</Label>
            <StarRating value={level} onChange={setLevel} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button disabled={updateMeta.isPending} onClick={() => void submit()}>
            <Save />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
