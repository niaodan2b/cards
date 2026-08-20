import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { CardList } from '@/components/CardList'
import { CardDetail } from '@/components/CardDetail'
import { CreateCardDialog } from '@/components/CreateCardDialog'
import { useCardList } from '@/hooks/useCards'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const queryClient = new QueryClient()

function CardsPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [keyword, setKeyword] = useState('')
  const { data: cards = [] } = useCardList(keyword)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const selected = cards.find((card) => card.id === selectedId) ?? null

  const handleSelect = (id: number) => {
    setSelectedId(id)
    if (!isDesktop) {
      setSheetOpen(true)
    }
  }

  const handleCreated = (id: number) => {
    setSelectedId(id)
    if (!isDesktop) {
      setSheetOpen(true)
    }
  }

  const handleDeleted = () => {
    setSelectedId(null)
    setSheetOpen(false)
  }

  const list = (
    <CardList
      cards={cards}
      keyword={keyword}
      selectedId={selectedId}
      onSelect={handleSelect}
      onCreate={() => setCreateOpen(true)}
      onSearch={setKeyword}
    />
  )

  return (
    <div className="flex h-dvh w-full overflow-hidden pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      {isDesktop ? (
        <>
          <aside className="w-72 shrink-0 border-r">{list}</aside>
          <main className="min-w-0 flex-1">
            {selected ? (
              <CardDetail key={selected.id} card={selected} keyword={keyword} onDeleted={handleDeleted} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground/60">
                未选中卡片
              </div>
            )}
          </main>
        </>
      ) : (
        <>
          <main className="min-w-0 flex-1">{list}</main>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-[85%] sm:max-w-md">
              <SheetTitle className="sr-only">卡片详情</SheetTitle>
              {selected && <CardDetail key={selected.id} card={selected} keyword={keyword} onDeleted={handleDeleted} />}
            </SheetContent>
          </Sheet>
        </>
      )}
      <CreateCardDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CardsPage />
    </QueryClientProvider>
  )
}
