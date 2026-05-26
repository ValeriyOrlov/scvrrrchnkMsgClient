import { useQuery } from '@tanstack/react-query'
import { getChats } from '../lib/api.ts'

export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
    staleTime: 30_000,
    retry: 1,
  })
}