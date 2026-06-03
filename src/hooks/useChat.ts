import { useQuery } from '@tanstack/react-query'
import { getChat } from '../lib/api'

export function useChat(chatId: number) {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChat(chatId),
    enabled: !!chatId,
  })
}