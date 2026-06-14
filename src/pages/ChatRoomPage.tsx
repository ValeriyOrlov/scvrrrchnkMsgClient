import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { useMessages } from '../hooks/useMessages'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import bgPattern from '../assets/images/messages-box-background-blue.jpg'


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
    <div className="h-full flex flex-col">
      {/* Хедер с названием чата и кнопкой назад */}
      <header className="p-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 justify-between">
        <button onClick={() => navigate('/chats', { replace: true })} className="text-blue-500">
          ← Назад
        </button>
        <h2 
          className="text-lg font-semibold truncate">
          {displayName}
        </h2>
        <span
          className='cursor-pointer'
          onClick={() => navigate(`/chats/${chatId}/info`)}
        >
          chat info
        </span>
      </header>
      {/* Список сообщений */}
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
      {/* Поле ввода */}
      <div className="flex-shrink-0">
        <MessageInput chatId={chatId} />
      </div>
    </div>
  )
}