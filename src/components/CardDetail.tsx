import { useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Pencil, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StarRating } from '@/components/StarRating'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { useRemoveCard, useUpdateCard } from '@/hooks/useCards'
import { highlightText } from '@/lib/highlight'
import type { Card } from '@/lib/types'

const TIME_FORMAT = 'YYYY-MM-DD HH:mm'

type CardDetailProps = {
  card: Card
  keyword?: string
  initialEditing?: boolean
  onDeleted: () => void
}

export function CardDetail({ card, keyword = '', initialEditing = false, onDeleted }: CardDetailProps) {
  const [editing, setEditing] = useState(initialEditing)
  const [title, setTitle] = useState(card.title)
  const [level, setLevel] = useState(card.level)
  const [content, setContent] = useState(card.content)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const draftRef = useRef({ title: card.title, level: card.level, content: card.content })
  const updateCard = useUpdateCard()
  const removeCard = useRemoveCard()

  const startEdit = () => {
    draftRef.current = { title, level, content }
    setError(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    const draft = draftRef.current
    setTitle(draft.title)
    setLevel(draft.level)
    setContent(draft.content)
    setError(null)
    setEditing(false)
  }

  const save = async () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('请填写标题')
      return
    }
    try {
      await updateCard.mutateAsync({ id: card.id, title: trimmed, level, content })
      setError(null)
      setEditing(false)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const confirmRemove = async () => {
    try {
      await removeCard.mutateAsync(card.id)
      setConfirmOpen(false)
      onDeleted()
    } catch (err) {
      setError((err as Error).message)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {editing ? (
        <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setError(null)
            }}
            className="flex-1"
          />
          <StarRating value={level} onChange={setLevel} />
        </div>
      ) : (
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="truncate text-base font-medium">{highlightText(title, keyword)}</h2>
            <StarRating value={level} />
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil />
              编辑
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
              <Trash2 />
              删除
            </Button>
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" onDoubleClick={editing ? undefined : startEdit}>
        <MarkdownEditor
          content={content}
          editable={editing}
          keyword={editing ? '' : keyword}
          autoFocus={editing}
          onChange={setContent}
        />
      </div>
      {editing ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-2.5">
          {error ? <p className="text-sm text-destructive">{error}</p> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              <X />
              取消
            </Button>
            <Button size="sm" disabled={updateCard.isPending} onClick={() => void save()}>
              <Save />
              保存
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="shrink-0 border-t px-4 py-2 text-xs text-muted-foreground">
            创建于 {dayjs(card.create_time).format(TIME_FORMAT)} · 更新于 {dayjs(card.update_time).format(TIME_FORMAT)}
          </div>
          {error && <p className="border-t px-4 py-2 text-sm text-destructive">{error}</p>}
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除卡片</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除「{title}」？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <X />
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeCard.isPending}
              onClick={() => void confirmRemove()}
            >
              <Trash2 />
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
