import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMessages } from '../hooks/useMessages'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const chatId = parseInt(id!)
  const { data: messages, isLoading, isError } = useMessages(chatId)
  const reversedMessages = messages ? [...messages].reverse() : []

  if (isLoading) return <div className="p-4">Загрузка...</div>
  if (isError) return <div className="p-4 text-red-500">Ошибка загрузки сообщений</div>

  return (
    <div className="flex flex-col h-screen">
      {/* Хедер с названием чата и кнопкой назад */}
      <header className="p-4 border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-blue-500">
          ← Назад
        </button>
        <h2 className="text-lg font-semibold">Чат {chatId}</h2>
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