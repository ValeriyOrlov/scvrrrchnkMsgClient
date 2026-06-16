import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState, useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { useMessages } from '../hooks/useMessages'
import { useUpdateMessage } from '../hooks/useUpdateMessage'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import bgPattern from '../assets/images/messages-box-background-blue.jpg'
import { useTypingStore } from '../store/typingStore'
import type { Message } from '../types'

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const chatId = parseInt(id!)
  const { data: messages, isPending: isMessagesLoading, isError } = useMessages(chatId)
  const { data: chat, isPending: isChatLoading } = useChat(chatId)

  // Состояния для цитирования и редактирования
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editMessage, setEditMessage] = useState<Message | null>(null)

  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const updateMutation = useUpdateMessage(chatId)

  const typingUsers = useTypingStore(
    useShallow((state) => state.typing[chatId] || [])
  )

  const reversedMessages = useMemo(() => messages ? [...messages].reverse() : [], [messages])

  const otherTypingUsers = useMemo(
    () => typingUsers.filter((id: number) => id !== user?.id),
    [typingUsers, user?.id]
  )

  const displayName = useMemo(() => {
    if (!chat) return ''
    if (chat.type === 'private') {
      const otherMember = chat.members?.find(m => m.user?.id !== user?.id)
      return otherMember?.user?.username || 'Приватный чат'
    }
    return chat.chat_name || 'Группа'
  }, [chat, user?.id])

  const typingText = useMemo(() => {
    if (otherTypingUsers.length === 0) return ''
    if (chat?.type === 'private') return 'печатает...'
    return otherTypingUsers
      .map(id => chat?.members?.find(m => m.user.id === id)?.user?.username || 'Кто-то')
      .join(', ') + ' печатает...'
  }, [otherTypingUsers, chat])

  const scrollToMessage = (messageId: number) => {
    const el = messageRefs.current[messageId]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-blue-400')
    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 2000)
  }

  const handleStartEdit = (msg: Message) => {
    setReplyTo(null)            // цитирование и редактирование несовместимы
    setEditMessage(msg)
  }

  const handleCancelEdit = () => setEditMessage(null)

  // Колбэк сохранения редактированного сообщения
  const handleSaveEdit = (messageId: number, content: string) => {
    updateMutation.mutate({ messageId, content })
    setEditMessage(null)
  }

  if (isChatLoading || isMessagesLoading) return <div className="p-4">Загрузка...</div>
  if (isError) return <div className="p-4 text-red-500">Ошибка загрузки сообщений</div>

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 justify-between">
        <button onClick={() => navigate('/chats', { replace: true })} className="text-blue-500">
          ← Назад
        </button>
        <div>
          <h2 className="text-lg font-semibold truncate">{displayName}</h2>
          {typingText ? (
            <p className="text-sm text-gray-500 italic">{typingText}</p>
          ) : (
            <p className="text-sm text-gray-500 italic invisible" aria-hidden="true">
              &nbsp;
            </p>
          )}
        </div>
        <span
          className='cursor-pointer'
          onClick={() => navigate(`/chats/${chatId}/info`)}
        >
          chat info
        </span>
      </header>
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          backgroundImage: `url(${bgPattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px'
        }}
      >
        {reversedMessages &&
          <MessageList 
            messages={reversedMessages}
            currentUserId={user!.id}
            chatId={chatId}
            onReply={setReplyTo}
            onEdit={handleStartEdit}
            onScrollToReply={scrollToMessage}
            messageRefs={messageRefs}
          />
        }
      </div>
      <div className="flex-shrink-0">
        <MessageInput
          chatId={chatId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editMessage={editMessage}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
        />
      </div>
    </div>
  )
}