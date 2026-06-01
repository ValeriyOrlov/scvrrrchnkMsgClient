import { useChats } from '../hooks/useChats.ts'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ChatsSkeleton } from '../components/ChatsSkeleton.tsx'
import { ErrorView } from '../components/ErrorView.tsx'
import { EmptyView } from '../components/EmptyView.tsx'
import { ChatListItem } from '../components/ChatListItem.tsx'

export default function ChatsPage() {
  const { user, logout } = useAuth()
  console.log(user)
  const navigate = useNavigate()
  const { data: chats, isLoading, isError, refetch } = useChats()
  const handleChatClick = (chatId: number) => {
    navigate(`/chats/${chatId}`)
  }

  const handleLogout = () => {
    logout() // очищает токены и Zustand
    navigate('/login', { replace: true }) // перенаправляем на страницу входа
    // replace: true убирает "/chats" из истории, чтобы кнопка "Назад" не возвращала обратно
  }

  if (isLoading) return <ChatsSkeleton />
  if (isError) return <ErrorView onRetry={refetch} />
  if (!chats || chats.length === 0) return <EmptyView />
  return (
      <div className="flex flex-col h-full">
      {/* Хедер с именем пользователя и кнопкой выхода */}
      <header className="p-4 border-b border-gray-200 flex justify-between items-center">

        <h2 className="text-lg font-semibold">{user?.username}</h2>
        <button onClick={handleLogout} className="text-sm text-red-500">Выйти</button>
      </header>
      <ul className="flex-1 overflow-y-auto">
        {chats.map(chat => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            currentUserId={user!.id}
            onPress={() => handleChatClick(chat.id)}
          />
        ))}
      </ul>
      <footer>
        <button
          onClick={() => navigate('/search')}
          className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg">
          + Новый чат
        </button>
      </footer>
    </div>
  )
}