import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { ChevronLeft, Ellipsis, Pencil, Pin, PinOff, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StarRating } from '@/components/StarRating'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { EditCardDialog } from '@/components/EditCardDialog'
import { useRemoveCard, useUpdateCardContent, useUpdateCardPin } from '@/hooks/useCards'
import { api } from '@/lib/api'
import { highlightText } from '@/lib/highlight'
import type { Card } from '@/lib/types'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

type CardDetailProps = {
  card: Card
  keyword?: string
  autoFocus?: boolean
  onBack?: () => void
  onDeleted: () => void
}

export function CardDetail({ card, keyword = '', autoFocus = false, onBack, onDeleted }: CardDetailProps) {
  const [content, setContent] = useState(card.content)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const contentRef = useRef(card.content)
  const savedContentRef = useRef(card.content)
  const queryClient = useQueryClient()
  const updateContent = useUpdateCardContent()
  const updatePin = useUpdateCardPin()
  const removeCard = useRemoveCard()

  contentRef.current = content

  useEffect(() => {
    savedContentRef.current = card.content
  }, [card.content])

  const saveContent = async (next: string) => {
    if (next === savedContentRef.current) return
    try {
      await updateContent.mutateAsync({ id: card.id, content: next })
      savedContentRef.current = next
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    return () => {
      const latest = contentRef.current
      if (latest === savedContentRef.current) return
      void api.updateCardContent({ id: card.id, content: latest }).then(() => {
        void queryClient.invalidateQueries({ queryKey: ['cards'] })
      })
    }
  }, [card.id, queryClient])

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

  const togglePin = async () => {
    try {
      await updatePin.mutateAsync({ id: card.id, pinned: !card.pinned })
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-start gap-1">
          {onBack ? (
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ChevronLeft />
            </Button>
          ) : null}
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="truncate text-base font-medium">{highlightText(card.title, keyword)}</h2>
            <StarRating value={card.level} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled={updatePin.isPending} onClick={() => void togglePin()}>
            {card.pinned ? <PinOff /> : <Pin />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                <Trash2 />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <MarkdownEditor
          content={content}
          keyword={keyword}
          autoFocus={autoFocus}
          onChange={setContent}
          onBlur={(markdown) => {
            void saveContent(markdown)
          }}
        />
      </div>
      <div className="flex h-8 shrink-0 items-center border-t px-4 text-xs text-muted-foreground">
        创建于 {dayjs(card.create_time).fromNow()} · 更新于 {dayjs(card.update_time).fromNow()}
      </div>
      {error && <p className="border-t px-4 py-2 text-sm text-destructive">{error}</p>}

      <EditCardDialog open={editOpen} onOpenChange={setEditOpen} card={card} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除卡片</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除「{card.title}」？此操作不可恢复。
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
