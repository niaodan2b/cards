import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from 'react'
import { Loader2, Pin, PinOff, Plus, RotateCcw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardSearchInput } from '@/components/CardSearchInput'
import { Toggle } from '@/components/ui/toggle'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { StarRating } from '@/components/StarRating'
import { SettingsDialog } from '@/components/SettingsDialog'
import { useUpdateCardPin } from '@/hooks/useCards'
import { cn } from '@/lib/utils'
import { contentSnippet, highlightText } from '@/lib/highlight'
import type { Card } from '@/lib/types'

const RECENT_SORT_KEY = 'cards.recent-sort'

function loadRecentSort(): boolean {
  try {
    return localStorage.getItem(RECENT_SORT_KEY) === '1'
  } catch {
    return false
  }
}

function saveRecentSort(value: boolean) {
  try {
    localStorage.setItem(RECENT_SORT_KEY, value ? '1' : '0')
  } catch {}
}

type CardListProps = {
  cards: Card[]
  keyword: string
  selectedId: number | null
  appVersion?: string
  checkingUpdate?: boolean
  showFooter?: boolean
  cardTotal?: number
  onSelect: (id: number) => void
  onCreate: () => void
  onSearch: (keyword: string) => void
}

export function CardList({
  cards,
  keyword,
  selectedId,
  appVersion,
  checkingUpdate,
  showFooter = false,
  cardTotal = 0,
  onSelect,
  onCreate,
  onSearch,
}: CardListProps) {
  const [draft, setDraft] = useState(keyword)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [recent, setRecent] = useState(loadRecentSort)
  const [error, setError] = useState<string | null>(null)
  const updatePin = useUpdateCardPin()

  useEffect(() => {
    setDraft(keyword)
  }, [keyword])

  const handleRecentChange = (pressed: boolean) => {
    setRecent(pressed)
    saveRecentSort(pressed)
  }

  const displayedCards = recent
    ? [...cards].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return Date.parse(b.update_time) - Date.parse(a.update_time)
      })
    : cards

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(draft.trim())
  }

  const reset = () => {
    setDraft('')
    onSearch('')
  }

  const togglePin = async (card: Card) => {
    try {
      await updatePin.mutateAsync({ id: card.id, pinned: !card.pinned })
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">Cards</span>
          {appVersion ? (
            <span className="text-[11px] tabular-nums leading-none text-muted-foreground">{appVersion}</span>
          ) : null}
          {checkingUpdate ? <Loader2 className="size-3 animate-spin text-muted-foreground" /> : null}
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus />
          新增
        </Button>
      </div>
      <form className="relative z-10 flex items-center gap-1.5 border-b px-3 py-2" onSubmit={submit}>
        <Toggle
          type="button"
          variant="outline"
          size="sm"
          pressed={recent}
          onPressedChange={handleRecentChange}
        >
          Recent
        </Toggle>
        <CardSearchInput id="cards-search" value={draft} onChange={setDraft} onPick={onSelect} />
        {keyword ? (
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            <RotateCcw />
            重置
          </Button>
        ) : null}
      </form>
      {error ? <p className="border-b px-3 py-1.5 text-sm text-destructive">{error}</p> : null}
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {displayedCards.map((card) => (
          <CardListItem
            key={card.id}
            card={card}
            keyword={keyword}
            selected={selectedId === card.id}
            onSelect={onSelect}
            onTogglePin={(target) => void togglePin(target)}
          />
        ))}
      </div>
      {showFooter ? (
        <>
          <div className="flex h-8 shrink-0 items-center justify-between border-t px-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="设置"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings />
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">{cardTotal}</span>
          </div>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
      ) : null}
    </div>
  )
}

type CardListItemProps = {
  card: Card
  keyword: string
  selected: boolean
  onSelect: (id: number) => void
  onTogglePin: (card: Card) => void
}

function CardListItem({ card, keyword, selected, onSelect, onTogglePin }: CardListItemProps) {
  const pointerTypeRef = useRef('mouse')
  const suppressClickRef = useRef(false)
  const snippet = keyword ? contentSnippet(card.content, keyword) : ''

  const handleOpenChange = (open: boolean) => {
    if (!open || pointerTypeRef.current !== 'touch') return
    suppressClickRef.current = true
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 350)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    pointerTypeRef.current = event.pointerType
  }

  const handleTouchStart = () => {
    pointerTypeRef.current = 'touch'
  }

  const handleTouchEnd = (event: ReactTouchEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) event.preventDefault()
  }

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    onSelect(card.id)
  }

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger
        render={<button type="button" />}
        className={cn(
          'flex w-full flex-col gap-1 rounded-lg px-2.5 py-2 text-left outline-none select-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-muted',
          selected && 'bg-muted',
        )}
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <div className="flex w-full min-w-0 items-center gap-2">
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm">{highlightText(card.title, keyword)}</span>
            <StarRating value={card.level} />
            {snippet ? (
              <span className="line-clamp-1 text-xs text-muted-foreground">{highlightText(snippet, keyword)}</span>
            ) : null}
          </span>
          {card.pinned ? <Pin className="size-3.5 shrink-0 text-muted-foreground" /> : null}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onTogglePin(card)}>
          {card.pinned ? <PinOff /> : <Pin />}
          {card.pinned ? '取消置顶' : '置顶'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
