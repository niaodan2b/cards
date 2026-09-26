import { useCallback, useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Update } from '@tauri-apps/plugin-updater'
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
import { Progress } from '@/components/ui/progress'
import { CardList } from '@/components/CardList'
import { CardDetail } from '@/components/CardDetail'
import { CreateCardDialog } from '@/components/CreateCardDialog'
import { useCardList } from '@/hooks/useCards'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { ShortcutsProvider, useShortcutListener } from '@/hooks/useShortcuts'
import {
  checkAppUpdate,
  getAppVersion,
  installAppUpdate,
  isTauri,
  updateProgressLabel,
  updateProgressValue,
  type UpdateProgress,
} from '@/lib/updater'

const queryClient = new QueryClient()

type DetailHistoryState = { cardDetail: number }
type SearchHistoryState = { cardSearch: true }

function isDetailState(state: unknown): state is DetailHistoryState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'cardDetail' in state &&
    typeof (state as DetailHistoryState).cardDetail === 'number'
  )
}

function isSearchState(state: unknown): state is SearchHistoryState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'cardSearch' in state &&
    (state as SearchHistoryState).cardSearch === true
  )
}

function CardsPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [keyword, setKeyword] = useState('')
  const { data: cards = [] } = useCardList(keyword)
  const { data: allCards = [] } = useCardList()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [autoFocusId, setAutoFocusId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null)
  const [appVersion, setAppVersion] = useState('')
  const [checkingUpdate, setCheckingUpdate] = useState(isTauri)

  const selected = allCards.find((card) => card.id === selectedId) ?? null

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const version = await getAppVersion()
      if (!cancelled) setAppVersion(version)
      try {
        const update = await checkAppUpdate()
        if (!cancelled && update) setPendingUpdate(update)
      } finally {
        if (!cancelled) setCheckingUpdate(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleInstallUpdate = async () => {
    if (!pendingUpdate) return
    setUpdating(true)
    setUpdateProgress({ downloaded: 0, status: 'downloading' })
    try {
      await installAppUpdate(pendingUpdate, setUpdateProgress)
    } catch {
      setUpdating(false)
      setUpdateProgress(null)
    }
  }

  useEffect(() => {
    const onPop = () => {
      if (isDetailState(history.state)) {
        setSelectedId(history.state.cardDetail)
      } else {
        setSelectedId(null)
        if (!isSearchState(history.state)) {
          setKeyword('')
        }
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const handleSelect = (id: number) => {
    setSelectedId(id)
    setAutoFocusId(null)
    if (!isDesktop) {
      if (isDetailState(history.state)) {
        history.replaceState({ cardDetail: id }, '')
      } else {
        history.pushState({ cardDetail: id }, '')
      }
    }
  }

  const handleCreated = (id: number) => {
    if (!isDesktop) return
    setSelectedId(id)
    setAutoFocusId(id)
  }

  const handleDeleted = () => {
    setSelectedId(null)
    if (isDetailState(history.state)) {
      history.back()
    }
  }

  const handleBack = () => {
    if (isDetailState(history.state)) {
      history.back()
    } else {
      setSelectedId(null)
    }
  }

  const handleSearch = (q: string) => {
    const next = q.trim()
    setKeyword(next)
    if (isDesktop) return
    if (next) {
      if (!isSearchState(history.state) && !isDetailState(history.state)) {
        history.pushState({ cardSearch: true }, '')
      }
    } else if (isSearchState(history.state)) {
      history.back()
    }
  }

  const handleCreate = useCallback(() => {
    setCreateOpen(true)
  }, [])

  const handleFocusSearch = useCallback(() => {
    const el = document.getElementById('cards-search') as HTMLInputElement | null
    el?.focus()
    el?.select()
  }, [])

  useShortcutListener({
    onCreateCard: handleCreate,
    onSearch: handleFocusSearch,
  })

  const list = (
    <CardList
      cards={cards}
      keyword={keyword}
      selectedId={selectedId}
      appVersion={appVersion}
      checkingUpdate={checkingUpdate}
      showFooter={isDesktop}
      cardTotal={allCards.length}
      onSelect={handleSelect}
      onCreate={handleCreate}
      onSearch={handleSearch}
    />
  )

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      {isDesktop ? (
        <>
          <aside className="w-72 shrink-0 border-r">{list}</aside>
          <main className="min-w-0 flex-1">
            {selected ? (
              <CardDetail
                key={selected.id}
                card={selected}
                keyword={keyword}
                autoFocus={selected.id === autoFocusId}
                onDeleted={handleDeleted}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground/60">
                未选中卡片
              </div>
            )}
          </main>
        </>
      ) : (
        <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)]">
          <div
            className={cn(
              'col-start-1 row-start-1 h-full min-h-0 overflow-hidden',
              selected && 'pointer-events-none invisible',
            )}
            inert={!!selected}
          >
            {list}
          </div>
          {selected ? (
            <div className="col-start-1 row-start-1 h-full min-h-0 overflow-hidden">
              <CardDetail
                key={selected.id}
                card={selected}
                keyword={keyword}
                autoFocus={selected.id === autoFocusId}
                onBack={handleBack}
                onDeleted={handleDeleted}
              />
            </div>
          ) : null}
        </main>
      )}
      <CreateCardDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />

      <AlertDialog
        open={!!pendingUpdate}
        onOpenChange={(open) => {
          if (!open && !updating) {
            setPendingUpdate(null)
            setUpdateProgress(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingUpdate?.version}</AlertDialogTitle>
          </AlertDialogHeader>
          {updating ? (
            <div className="grid gap-2">
              <Progress value={updateProgressValue(updateProgress) ?? null} />
              <AlertDialogDescription className="tabular-nums">
                {updateProgressLabel(updateProgress ?? { downloaded: 0, status: 'downloading' })}
              </AlertDialogDescription>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>
              <X />
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={updating}
              onClick={(e) => {
                e.preventDefault()
                void handleInstallUpdate()
              }}
            >
              <Download />
              更新
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ShortcutsProvider>
        <CardsPage />
      </ShortcutsProvider>
    </QueryClientProvider>
  )
}
