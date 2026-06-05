import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useAuthStore from '../store/authStore'

export function useWebSocket() {
  const queryClient = useQueryClient()
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | undefined>(undefined)

  const connect = useCallback(() => {
    const token = useAuthStore.getState().accessToken
    if (!token) return

    const ws = new WebSocket(`ws://localhost:8081/ws?token=${token}`)
    socketRef.current = ws

    ws.onopen = () => console.log('WebSocket connected')
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chat_message') {
          queryClient.invalidateQueries({ queryKey: ['messages', data.chat_id] })
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        } else if (data.type === 'message_updated' || data.type === 'message_deleted') {
        // Достаём chat_id из вложенного message или из отдельного поля
          const chatId = data.message?.chat_id || data.chat_id
          if (chatId) {
            queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
            queryClient.invalidateQueries({ queryKey: ['chats'] })
          }
        } else if (data.type === 'user_status') {
          queryClient.setQueryData(['onlineUsers'], (old: number[] = []) => {
            if (data.online) {
              return [...new Set([...old, data.user_id])]
            } else {
              return old.filter(id => id !== data.user_id)
            }
          })
        }
      } catch (err) {
        console.error('Invalid WS message', err)
      }
    }
    ws.onclose = () => {
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000)
    }
    ws.onerror = (error) => {
      console.error('WebSocket error', error)
    }
  }, [queryClient])

  // Первичное подключение при монтировании
  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimeoutRef.current)
      socketRef.current?.close()
    }
  }, [connect]) // connect стабилен, так как использует useCallback с пустыми зависимостями

  // Следим за изменением токена (логин/логаут)
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state, prevState) => {
      // Если токен появился (после логина) – переподключаемся
      if (state.accessToken && state.accessToken !== prevState.accessToken) {
        socketRef.current?.close()
        connect()
      }
      // Если токен исчез (логаут) – закрываем соединение
      if (!state.accessToken && prevState.accessToken) {
        socketRef.current?.close()
      }
    })
    return unsubscribe
  }, [connect])
}