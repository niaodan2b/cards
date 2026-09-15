export type Card = {
  id: number
  title: string
  content: string
  level: number
  pinned: boolean
  create_time: string
  update_time: string
}

export type CreateCardPayload = {
  title: string
  level: number
}

export type UpdateCardContentPayload = {
  id: number
  content: string
}

export type UpdateCardMetaPayload = {
  id: number
  title: string
  level: number
}

export type UpdateCardPinPayload = {
  id: number
  pinned: boolean
}
