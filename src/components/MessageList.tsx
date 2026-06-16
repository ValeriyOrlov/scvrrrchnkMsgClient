import { useMemo, useRef, useEffect } from 'react'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'

interface Props {
  messages: Message[]
  currentUserId: number
  chatId: number
  onReply?: (msg: Message) => void
  onForward?: (msg: Message) => void
  onEdit?: (msg: Message) => void
  onScrollToReply?: (messageId: number) => void
  messageRefs?: React.RefObject<Record<number, HTMLDivElement | null>>
}

export default function MessageList({ messages, currentUserId, chatId, onReply, onForward, onEdit, onScrollToReply, messageRefs }: Props) {
  const messagesMap = useMemo(() => {
    const map = new Map<number, Message>()
    messages.forEach(msg => map.set(msg.id, msg))
    return map
  }, [messages])

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="p-4 space-y-1">
      {messages.map(msg => (
        <div
          key={msg.id}
          ref={(el) => { if (messageRefs) messageRefs.current[msg.id] = el }}
        >
          <MessageBubble
            message={msg}
            isOwn={msg.sender_id === currentUserId}
            chatId={chatId}
            onReply={onReply}
            onForward={onForward}
            onEdit={onEdit}
            onScrollToReply={onScrollToReply}
            messagesMap={messagesMap}
          />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}