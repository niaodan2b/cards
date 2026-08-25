import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Update } from '@tauri-apps/plugin-updater'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
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

function CardsPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [keyword, setKeyword] = useState('')
  const { data: cards = [] } = useCardList(keyword)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editOnSelectId, setEditOnSelectId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null)
  const [appVersion, setAppVersion] = useState('')
  const [checkingUpdate, setCheckingUpdate] = useState(isTauri)

  const selected = cards.find((card) => card.id === selectedId) ?? null

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

  const handleSelect = (id: number) => {
    setSelectedId(id)
    setEditOnSelectId(null)
    if (!isDesktop) {
      setSheetOpen(true)
    }
  }

  const handleCreated = (id: number) => {
    setSelectedId(id)
    setEditOnSelectId(id)
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
      appVersion={appVersion}
      checkingUpdate={checkingUpdate}
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
              <CardDetail
                key={selected.id}
                card={selected}
                keyword={keyword}
                initialEditing={selected.id === editOnSelectId}
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
        <>
          <main className="min-w-0 flex-1">{list}</main>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-[85%] sm:max-w-md">
              <SheetTitle className="sr-only">卡片详情</SheetTitle>
              {selected && (
                <CardDetail
                  key={selected.id}
                  card={selected}
                  keyword={keyword}
                  initialEditing={selected.id === editOnSelectId}
                  onDeleted={handleDeleted}
                />
              )}
            </SheetContent>
          </Sheet>
        </>
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
            <AlertDialogCancel disabled={updating}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={updating}
              onClick={(e) => {
                e.preventDefault()
                void handleInstallUpdate()
              }}
            >
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
      <CardsPage />
    </QueryClientProvider>
  )
}
