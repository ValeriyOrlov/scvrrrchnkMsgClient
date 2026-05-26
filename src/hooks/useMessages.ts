import { useQuery } from '@tanstack/react-query'
import { getMessages } from '../lib/api.ts'

export function useMessages(chatId: number, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['messages', chatId, limit, offset],
    queryFn: () => getMessages(chatId, limit, offset),
    staleTime: 10_000,
    retry: 1,
  })
}