import { useQuery } from '@tanstack/react-query'
import { getOnlineUsers } from '../lib/api'

export function useOnlineUsers() {
  return useQuery({
    queryKey: ['onlineUsers'],
    queryFn: getOnlineUsers,
    refetchInterval: 30_000, //обновляем каждые 30 секунд
  })
}