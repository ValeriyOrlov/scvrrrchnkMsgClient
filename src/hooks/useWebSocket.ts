import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useAuthStore from '../store/authStore'

export function useWebSocket() {
  const queryClient = useQueryClient()
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | undefined>(undefined)

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data))
    }
  }, [])

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
          queryClient.invalidateQueries({ queryKey: ['messages'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        } else if (data.type === 'message_updated' || data.type === 'message_deleted') {
          console.log(data.type)
          const chatId = data.message?.chat_id || data.chat_id
          if (chatId) {
            queryClient.invalidateQueries({ queryKey: ['messages'], exact: false })
            queryClient.invalidateQueries({ queryKey: ['chats'] })
          }
        } else if (data.type === 'user_status') {
            console.log('Received user_status:', data)

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
      console.log('WebSocket disconnected')
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000)
    }
    ws.onerror = (error) => {
      console.error('WebSocket error', error)
    }
  }, [queryClient])

// Подключаемся при монтировании, если есть токен
  useEffect(() => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      connect()
    }
    return () => {
      clearTimeout(reconnectTimeoutRef.current)
      socketRef.current?.close()
    }
  }, [connect])

  // Следим за изменением токена (логин/логаут)
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state, prevState) => {
      if (state.accessToken && !prevState.accessToken) {
        socketRef.current?.close()
        connect()
      } else if (!state.accessToken && prevState.accessToken) {
        socketRef.current?.close()
      }
    })
    return unsubscribe
  }, [connect])

  return { sendMessage }
}