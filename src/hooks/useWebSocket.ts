import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useAuthStore from '../store/authStore.ts'
import type { Message } from '../types/index.ts'

export function useWebSocket() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!accessToken) return

    const connect = () => {
      const ws = new WebSocket(`ws://localhost:8081/ws?token=${accessToken}`)
      socketRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const message: Message = JSON.parse(event.data)
          // Инвалидируем кеш сообщений для этого чата
          queryClient.invalidateQueries({
            queryKey: ['messages', message.chat_id],
          })
          //инвалидируем список чатов, чтобы обновить последнее сообщение
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        } catch (err) {
          console.error('Invalid WS message', err)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        // Переподключение черех 3 секунды
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error', error)
        ws.close()
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeoutRef.current)
      socketRef.current?.close()
    }
  }, [accessToken, queryClient])
}
