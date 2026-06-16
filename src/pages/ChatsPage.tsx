import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useChats } from '../hooks/useChats'
import { ChatListItem } from '../components/ChatListItem'
import { ChatsSkeleton } from '../components/ChatsSkeleton'
import { ErrorView } from '../components/ErrorView'
import { EmptyView } from '../components/EmptyView'
import { useQuery } from '@tanstack/react-query'
import { getOnlineUsers } from '../lib/api'

export default function ChatsPage() {
  const { user: currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const { data: chats, isLoading, isError, refetch } = useChats()
  const { data: onlineUsers = [] } = useQuery({
    queryKey: ['onlineUsers'],
    queryFn: getOnlineUsers,
    staleTime: Infinity,
  })

  // При монтировании компонента принудительно обновляем список чатов
  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
    }
  }, [currentUser, navigate])

  // Пока пользователь не определен, можно показать пустоту или лоадер
  if (!currentUser) {
    return null
  }

  const handleChatClick = (chatId: number) => {
    navigate(`/chats/${chatId}`)
  }

  if (isLoading) return <ChatsSkeleton />
  if (isError) return <ErrorView onRetry={refetch} />
  if (!chats || chats.length === 0) return <EmptyView />

  // сортировка чатов по времени

  const sortedChats = [...chats].sort((a, b) => {
  // Извлекаем даты последних сообщений (ISO‑строки)
    const aDate = a.last_message?.created_at ?? ''
    const bDate = b.last_message?.created_at ?? ''

    // Сравниваем: сначала идут чаты с более свежими сообщениями
    if (aDate && bDate) {
      return bDate.localeCompare(aDate) // по убыванию
    }
    // Если сообщение есть только у одного — он выше
    if (aDate && !bDate) return -1
    if (!aDate && bDate) return 1
    // Если у обоих нет сообщений — сортируем по id чата (больший id = новее)
    return b.id - a.id
  })
  return (
    <div className="relative flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{currentUser.username}</h2>
        <button onClick={logout} className="text-sm text-red-500">Выйти</button>
      </header>
      <ul className="flex-1 overflow-y-auto">
        {sortedChats.map(chat => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            currentUserId={currentUser.id}
            onlineUsers={onlineUsers}
            onPress={() => handleChatClick(chat.id)}
          />
        ))}
      </ul>
      <button
        onClick={() => navigate('/search')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-600 active:scale-95 transition-transform"
      >
        +
      </button>
    </div>
  )
}