import { useState, useRef, useEffect } from 'react'
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
  const { user: currentUser, logout, backupCreated } = useAuth()
  const navigate = useNavigate()
  const { data: chats, isLoading, isError, refetch } = useChats()
  const { data: onlineUsers = [] } = useQuery({
    queryKey: ['onlineUsers'],
    queryFn: getOnlineUsers,
    staleTime: Infinity,
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Закрытие меню при клике вне
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [menuOpen])

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
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
          >
            <h2 className="text-lg font-semibold">{currentUser?.username}</h2>
            {!backupCreated && (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-yellow-400 text-white text-xs rounded-full" title="Создайте резервную копию ключа">
                !
              </span>
            )}
            <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-xl py-2 z-20">
              <button
                onClick={() => { navigate('/backup'); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                🔐 Резервное копирование
              </button>
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
              >
                🚪 Выйти
              </button>
            </div>
          )}
        </div>
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