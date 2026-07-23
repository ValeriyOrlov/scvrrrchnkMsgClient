import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useAuthStore from '../store/authStore'
import { useTypingStore } from '../store/typingStore'

let socketCounter = 0

export function useWebSocket() {
  const queryClient = useQueryClient()
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | undefined>(undefined)

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not open, readyState:', socketRef.current?.readyState)
    }
  }, [])

  const connect = useCallback(() => {
    const token = useAuthStore.getState().accessToken
    if (!token) return

    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws'
    const socket = new WebSocket(`${wsUrl}?token=${token}`)
    ;(socket as any).__id = ++socketCounter
    socketRef.current = socket

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'chat_message') {
          const chatId = data.message?.chat_id
          if (chatId) {
            queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
            queryClient.invalidateQueries({ queryKey: ['chats'] })
          }
        } else if (data.type === 'message_updated' || data.type === 'message_deleted') {
          const chatId = data.message?.chat_id || data.chat_id
          if (chatId) {
            queryClient.invalidateQueries({ queryKey: ['messages'], exact: false })
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
          queryClient.invalidateQueries({ queryKey: ['onlineUsers'] })
        } else if (data.type === 'typing') {
          const { chat_id, user_id } = data
          useTypingStore.getState().setTyping(chat_id, user_id, true)
          setTimeout(() => {
            useTypingStore.getState().setTyping(chat_id, user_id, false)
          }, 3000)
        } else if (data.type === 'messages_read') {
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        }
      } catch (err) {
        console.error('Invalid WS message', err)
      }
    }
    socket.onclose = () => {
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000)
    }
    socket.onerror = (error) => {
      console.error('WebSocket error', error)
    }
  }, [queryClient])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimeoutRef.current)
      socketRef.current?.close()
    }
  }, [connect])

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state, prevState) => {
      if (state.accessToken && !prevState.accessToken) {
        connect()
      } else if (!state.accessToken && prevState.accessToken) {
        socketRef.current?.close()
      }
    })
    return unsubscribe
  }, [connect])

  return { sendMessage }
}