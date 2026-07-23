import { useMemo, Fragment } from 'react'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'
import DateDivider from './DateDivider'

interface Props {
  messages: Message[]
  currentUserId: number
  chatId: number
  onReply?: (msg: Message) => void
  onForward?: (msg: Message) => void
  onEdit?: (msg: Message) => void
  messageRefs?: React.RefObject<Record<number, HTMLDivElement | null>>
  roomKey?: string | null
  chatType?: 'private' | 'group'
}

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate()

export default function MessageList({ messages, currentUserId, chatId, onReply, onForward, onEdit, messageRefs, roomKey, chatType }: Props) {
  const messagesMap = useMemo(() => {
    const map = new Map<number, Message>()
    messages.forEach(msg => map.set(msg.id, msg))
    return map
  }, [messages])

  let lastDate: Date | null = null

  return (
    <div className="p-4 space-y-1">
      {messages.map(msg => {
        const msgDate = new Date(msg.created_at)
        const showDivider = !lastDate || !isSameDay(lastDate, msgDate)
        if (showDivider) lastDate = msgDate

        return (
          <Fragment key={msg.id}>
            {showDivider && <DateDivider date={msgDate} />}
            <div id={`msg-${msg.id}`} ref={(el) => { if (messageRefs) messageRefs.current[msg.id] = el }}>
              <MessageBubble
                message={msg}
                isOwn={msg.sender_id === currentUserId}
                chatId={chatId}
                onReply={onReply}
                onForward={onForward}
                onEdit={onEdit}
                messagesMap={messagesMap}
                roomKey={roomKey}
                chatType={chatType}
              />
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}