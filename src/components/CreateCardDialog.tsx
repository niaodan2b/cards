import { useState } from 'react'
import { ListPlus, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { StarRating } from '@/components/StarRating'
import { TitleAutocompleteInput } from '@/components/TitleAutocompleteInput'
import { useCreateCard } from '@/hooks/useCards'

type CreateCardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: number) => void
}

export function CreateCardDialog({ open, onOpenChange, onCreated }: CreateCardDialogProps) {
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const createCard = useCreateCard()
  const canSave = level >= 1 && level <= 5

  const reset = () => {
    setTitle('')
    setLevel(0)
    setError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const submit = async (continueAdding: boolean) => {
    if (!canSave) return
    const trimmed = title.trim()
    if (!trimmed) {
      setError('请填写标题')
      return
    }
    try {
      const id = await createCard.mutateAsync({ title: trimmed, level })
      if (continueAdding) {
        reset()
      } else {
        reset()
        onOpenChange(false)
        onCreated(id)
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增卡片</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="card-title">标题</Label>
            <TitleAutocompleteInput
              id="card-title"
              value={title}
              autoFocus
              onChange={(next) => {
                setTitle(next)
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
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={!canSave || createCard.isPending}
            onClick={() => void submit(true)}
          >
            <ListPlus />
            保存后继续添加
          </Button>
          <Button disabled={!canSave || createCard.isPending} onClick={() => void submit(false)}>
            <Save />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
