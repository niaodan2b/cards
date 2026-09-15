import { useMemo, useState } from 'react'
import { Autocomplete } from '@base-ui/react/autocomplete'
import { Input } from '@/components/ui/input'
import { useCardList } from '@/hooks/useCards'

type TitleAutocompleteInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  excludeId?: number
  autoFocus?: boolean
}

const LIMIT = 8

export function TitleAutocompleteInput({
  id,
  value,
  onChange,
  excludeId,
  autoFocus,
}: TitleAutocompleteInputProps) {
  const { data: allCards = [] } = useCardList()
  const { contains } = Autocomplete.useFilter({ sensitivity: 'base' })
  const [open, setOpen] = useState(false)

  const titles = useMemo(
    () => allCards.filter((card) => card.id !== excludeId).map((card) => card.title),
    [allCards, excludeId],
  )

  const query = value.trim()
  const hasMatches = useMemo(() => {
    if (!query) return false
    return titles.some((title) => contains(title, query))
  }, [contains, query, titles])

  return (
    <Autocomplete.Root
      items={titles}
      value={value}
      onValueChange={onChange}
      limit={LIMIT}
      autoHighlight
      open={open && hasMatches}
      onOpenChange={setOpen}
      filter={(item, q) => {
        const trimmed = q.trim()
        if (!trimmed) return false
        return contains(item, trimmed)
      }}
    >
      <Autocomplete.Input id={id} autoFocus={autoFocus} render={<Input />} />
      <Autocomplete.Portal>
        <Autocomplete.Positioner className="isolate z-50 outline-none" sideOffset={4} align="start">
          <Autocomplete.Popup
            initialFocus={false}
            className="z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <Autocomplete.List>
              {(title: string) => (
                <Autocomplete.Item
                  key={title}
                  value={title}
                  className="flex cursor-default items-center rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {title}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}
