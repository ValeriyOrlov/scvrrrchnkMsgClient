import { useParams, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { useMessages } from '../hooks/useMessages'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import bgPattern from '../assets/images/messages-box-background-blue.jpg'
import { useTypingStore } from '../store/typingStore'

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const chatId = parseInt(id!)
  const { data: messages, isPending: isMessagesLoading, isError } = useMessages(chatId)
  const { data: chat, isPending: isChatLoading } = useChat(chatId)

  // Используем useShallow для предотвращения создания нового массива при каждом рендере
  const typingUsers = useTypingStore(
    useShallow((state) => state.typing[chatId] || [])
  )

  const reversedMessages = useMemo(() => messages ? [...messages].reverse() : [], [messages])

  // Мемоизируем производные значения
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
        {reversedMessages && <MessageList messages={reversedMessages} currentUserId={user!.id} chatId={chatId}/>}
      </div>
      <div className="flex-shrink-0">
        <MessageInput chatId={chatId} />
      </div>
    </div>
  )
}