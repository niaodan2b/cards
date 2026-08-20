import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const CARDS_KEY = ['cards']

export function useCardList(q?: string) {
  const keyword = q?.trim() ?? ''
  return useQuery({
    queryKey: [...CARDS_KEY, keyword],
    queryFn: () => api.listCards(keyword),
  })
}

export function useCreateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARDS_KEY }),
  })
}

export function useUpdateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.updateCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARDS_KEY }),
  })
}

export function useRemoveCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.removeCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARDS_KEY }),
  })
}
