import { useRef, useEffect } from 'react'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'

interface Props {
  messages: Message[]
  currentUserId: number
  chatId: number
}

export default function MessageList({ messages, currentUserId, chatId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="p-4 space-y-1">
      {messages.map(msg => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.sender_id === currentUserId}
          chatId={chatId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}