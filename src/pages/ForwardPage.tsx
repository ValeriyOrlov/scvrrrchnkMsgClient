import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useChats } from '../hooks/useChats'
import { ChatListItem } from '../components/ChatListItem'
import { ChatsSkeleton } from '../components/ChatsSkeleton'
import { ErrorView } from '../components/ErrorView'
import { EmptyView } from '../components/EmptyView'
import type { Message } from '../types'

export default function ForwardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { data: chats, isLoading, isError, refetch } = useChats()

  const state = location.state as { message?: Message; excludeChatId?: number } | null
  const message = state?.message
  const excludeChatId = state?.excludeChatId

  if (!message) {
    navigate(-1)
    return null
  }

  if (isLoading) return <ChatsSkeleton />
  if (isError) return <ErrorView onRetry={refetch} />
  if (!chats || chats.length === 0) return <EmptyView />

  const availableChats = chats.filter(chat => chat.id !== excludeChatId)

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Переслать сообщение</h2>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-500 mt-1">← Назад</button>
      </header>

      <ul className="flex-1 overflow-y-auto">
        {availableChats.map(chat => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            currentUserId={currentUser!.id}
            onlineUsers={[]}
            onPress={() => {
              navigate(`/chats/${chat.id}`, {
                state: { forwardMessage: message },
                replace: true,
              })
            }}
          />
        ))}
      </ul>
    </div>
  )
}