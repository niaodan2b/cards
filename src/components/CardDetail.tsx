import { useState } from 'react'
import dayjs from 'dayjs'
import { Pencil, Trash2 } from 'lucide-react'
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
import { MarkdownView } from '@/components/MarkdownView'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { useRemoveCard, useUpdateCard } from '@/hooks/useCards'
import { highlightText } from '@/lib/highlight'
import type { Card } from '@/lib/types'

const TIME_FORMAT = 'YYYY-MM-DD HH:mm'

type CardDetailProps = {
  card: Card
  keyword?: string
  onDeleted: () => void
}

export function CardDetail({ card, keyword = '', onDeleted }: CardDetailProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [level, setLevel] = useState(card.level)
  const [content, setContent] = useState(card.content)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const updateCard = useUpdateCard()
  const removeCard = useRemoveCard()

  const startEdit = () => {
    setTitle(card.title)
    setLevel(card.level)
    setContent(card.content)
    setError(null)
    setEditing(true)
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

  if (editing) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Input
            value={title}
            autoFocus
            onChange={(e) => {
              setTitle(e.target.value)
              setError(null)
            }}
            className="flex-1"
          />
          <StarRating value={level} onChange={setLevel} />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <MarkdownEditor initialContent={card.content} onChange={setContent} />
        </div>
        <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5">
          {error ? <p className="text-sm text-destructive">{error}</p> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              取消
            </Button>
            <Button size="sm" disabled={updateCard.isPending} onClick={() => void save()}>
              保存
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="truncate text-base font-medium">{highlightText(card.title, keyword)}</h2>
          <StarRating value={card.level} />
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
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <MarkdownView content={card.content} keyword={keyword} />
      </div>
      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        创建于 {dayjs(card.create_time).format(TIME_FORMAT)} · 更新于 {dayjs(card.update_time).format(TIME_FORMAT)}
      </div>
      {error && <p className="border-t px-4 py-2 text-sm text-destructive">{error}</p>}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除卡片</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除「{card.title}」？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeCard.isPending}
              onClick={() => void confirmRemove()}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
