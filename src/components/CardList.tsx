import { useState, type FormEvent } from 'react'
import { Loader2, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StarRating } from '@/components/StarRating'
import { cn } from '@/lib/utils'
import { contentSnippet, highlightText } from '@/lib/highlight'
import type { Card } from '@/lib/types'

type CardListProps = {
  cards: Card[]
  keyword: string
  selectedId: number | null
  appVersion?: string
  checkingUpdate?: boolean
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
  onSelect,
  onCreate,
  onSearch,
}: CardListProps) {
  const [draft, setDraft] = useState(keyword)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(draft.trim())
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">卡片</span>
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
      <form className="flex items-center gap-1.5 border-b px-3 py-2" onSubmit={submit}>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1" />
        <Button type="submit" size="sm">
          <Search />
          搜索
        </Button>
      </form>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {cards.map((card) => {
          const snippet = keyword ? contentSnippet(card.content, keyword) : ''
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className={cn(
                'flex w-full flex-col gap-1 rounded-lg px-2.5 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50',
                selectedId === card.id && 'bg-muted',
              )}
            >
              <span className="truncate text-sm">{highlightText(card.title, keyword)}</span>
              <StarRating value={card.level} />
              {snippet ? (
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {highlightText(snippet, keyword)}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
