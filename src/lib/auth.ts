// 单用户场景的轻量鉴权：token 存于设备本地（localStorage），首次 401 时录入一次
const TOKEN_STORAGE_KEY = 'api_token'

let token: string | null = localStorage.getItem(TOKEN_STORAGE_KEY)

// --- 录入框可见状态（供 AuthDialog 通过 useSyncExternalStore 订阅） ---

let dialogOpen = false
const listeners = new Set<() => void>()

const setDialogOpen = (open: boolean) => {
  dialogOpen = open
  listeners.forEach((listener) => listener())
}

export const authDialogStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot: () => dialogOpen,
}

// --- 录入流程（并发请求共享同一弹窗） ---

type Resolver = (value: string | null) => void
let pendingPromise: Promise<string | null> | null = null
let pendingResolve: Resolver | null = null

const promptToken = (): Promise<string | null> => {
  if (!pendingPromise) {
    setDialogOpen(true)
    pendingPromise = new Promise<string | null>((resolve) => {
      pendingResolve = resolve
    })
  }
  return pendingPromise
}

const settlePrompt = (value: string | null) => {
  setDialogOpen(false)
  pendingResolve?.(value)
  pendingResolve = null
  pendingPromise = null
}

export const submitToken = (value: string) => {
  token = value
  localStorage.setItem(TOKEN_STORAGE_KEY, value)
  settlePrompt(value)
}

export const cancelTokenPrompt = () => {
  settlePrompt(null)
}

const invalidateToken = () => {
  token = null
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

const withAuthHeader = (init?: RequestInit): RequestInit => {
  if (!token) return init ?? {}
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return { ...init, headers }
}

// 带鉴权的 fetch：401 时作废当前 token 并弹出录入框，录入后重试，取消则返回原 401 响应
export const fetchWithAuth = async (url: string, init?: RequestInit): Promise<Response> => {
  let resp = await fetch(url, withAuthHeader(init))
  while (resp.status === 401) {
    invalidateToken()
    const input = await promptToken()
    if (!input) return resp
    resp = await fetch(url, withAuthHeader(init))
  }
  return resp
}
