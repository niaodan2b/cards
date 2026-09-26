import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useCardList } from '@/hooks/useCards'
import { highlightText } from '@/lib/highlight'
import { cn } from '@/lib/utils'

const LIMIT = 8

type CardSearchInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  onPick: (id: number) => void
  className?: string
}

export function CardSearchInput({ id, value, onChange, onPick, className }: CardSearchInputProps) {
  const { data: allCards = [] } = useCardList()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const query = value.trim()
  const matches = useMemo(() => {
    if (!query) return []
    const needle = query.toLowerCase()
    return allCards.filter((card) => card.title.toLowerCase().includes(needle)).slice(0, LIMIT)
  }, [allCards, query])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative min-w-0 flex-1', className)}>
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
            return
          }
          if (event.key === 'Enter') setOpen(false)
        }}
        className="h-7 pr-7"
      />
      <Search className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      {open && matches.length > 0 ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {matches.map((card) => (
            <button
              key={card.id}
              type="button"
              className="flex w-full cursor-default items-center rounded-md px-1.5 py-1 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
              onPointerDown={(event) => {
                event.preventDefault()
                onPick(card.id)
                setOpen(false)
              }}
            >
              <span className="truncate">{highlightText(card.title, query)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
