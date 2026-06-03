import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { useMessages } from '../hooks/useMessages'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const chatId = parseInt(id!)
  const { data: messages, isPending: isMessagesLoading, isError } = useMessages(chatId)
  const { data: chat, isPending: isChatLoading } = useChat(chatId)
  
  const reversedMessages = messages ? [...messages].reverse() : []

  let displayName = ''
  if (chat) {
    if (chat.type === 'private') {
      const otherMember = chat.members?.find(m => m.user?.id !== user?.id)
      displayName = otherMember?.user?.username || 'Приватный чат'
    } else {
      displayName = chat.chat_name || 'Группа'
    }
  }

  if (isChatLoading || isMessagesLoading) return <div className="p-4">Загрузка...</div>

  if (isError) return <div className="p-4 text-red-500">Ошибка загрузки сообщений</div>

  return (
    <div className="flex flex-col h-screen">
      {/* Хедер с названием чата и кнопкой назад */}
      <header className="p-4 border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate('/chats', { replace: true })} className="text-blue-500">
          ← Назад
        </button>
        <h2 
          className="text-lg font-semibold cursor-pointer"
          onClick={() => navigate(`/chats/${chatId}/info`)}
        >
          {displayName} | i
        </h2>
      </header>
      {/* Список сообщений */}
      <div className="flex-1 overflow-y-auto">
        {reversedMessages && <MessageList messages={reversedMessages} currentUserId={user!.id} />}
      </div>
      {/* Поле ввода */}
      <MessageInput chatId={chatId} />
    </div>
  )
}