import type { Card, CreateCardPayload, UpdateCardContentPayload, UpdateCardMetaPayload } from './types'

const BASE = import.meta.env.VITE_API_URL as string

type Envelope<T> = {
  data: T
  ok: boolean
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = `请求失败 (${res.status})`
    try {
      const body = (await res.json()) as { message?: string | string[] }
      if (typeof body.message === 'string') {
        message = body.message
      } else if (Array.isArray(body.message) && body.message.length > 0) {
        message = body.message.join('; ')
      }
    } catch {
      // 非 JSON 响应时保留默认提示
    }
    throw new Error(message)
  }
  const body = (await res.json()) as Envelope<T>
  return body.data
}

export const api = {
  listCards: (q?: string) => {
    const keyword = q?.trim()
    const path = keyword ? `/cards/list?q=${encodeURIComponent(keyword)}` : '/cards/list'
    return request<Card[]>(path)
  },
  createCard: (payload: CreateCardPayload) =>
    request<number>('/cards/create', { method: 'POST', body: JSON.stringify(payload) }),
  updateCardContent: (payload: UpdateCardContentPayload) =>
    request<null>('/cards/update-content', { method: 'POST', body: JSON.stringify(payload) }),
  updateCardMeta: (payload: UpdateCardMetaPayload) =>
    request<null>('/cards/update-meta', { method: 'POST', body: JSON.stringify(payload) }),
  removeCard: (id: number) =>
    request<null>('/cards/remove', { method: 'POST', body: JSON.stringify({ id }) }),
}
