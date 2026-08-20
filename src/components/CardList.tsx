import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/StarRating'
import { cn } from '@/lib/utils'
import type { Card } from '@/lib/types'

type CardListProps = {
  cards: Card[]
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
}

export function CardList({ cards, selectedId, onSelect, onCreate }: CardListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">卡片</span>
        <Button size="sm" onClick={onCreate}>
          <Plus />
          新增
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={cn(
              'flex w-full flex-col gap-1 rounded-lg px-2.5 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50',
              selectedId === card.id && 'bg-muted',
            )}
          >
            <span className="truncate text-sm">{card.title}</span>
            <StarRating value={card.level} />
          </button>
        ))}
      </div>
    </div>
  )
}
