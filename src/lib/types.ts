export type Card = {
  id: number
  title: string
  content: string
  level: number
  create_time: string
  update_time: string
}

export type CreateCardPayload = {
  title: string
  level: number
}

export type UpdateCardPayload = {
  id: number
  title: string
  level: number
  content: string
}
