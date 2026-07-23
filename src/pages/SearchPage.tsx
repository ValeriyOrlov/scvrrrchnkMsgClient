import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchUsers, createChat, getAllUsers } from '../lib/api.ts'
import type { User } from '../types/index.ts'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // При монтировании загружаем всех пользователей
  useEffect(() => {
    setLoading(true)
    getAllUsers()
      .then(users => setResults(users))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Поиск с debounce и регистронезависимостью
  useEffect(() => {
    if (!query.trim()) {
      // Если поле поиска пустое, показываем всех пользователей
      getAllUsers()
        .then(users => setResults(users))
        .catch(console.error)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        // searchUsers теперь должен быть регистронезависимым на сервере
        const users = await searchUsers(query)
        setResults(users)
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleStartChat = async (userId: number) => {
    try {
      const chat = await createChat('private', '', [userId])
      navigate(`/chats/${chat.id}`)
    } catch (err) {
      console.error('Create chat failed', err)
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-2">
      <header className="p-4 border-b border-gray-200 flex items-center gap-3">
        <button
          onClick={() => navigate('/chats')}
          className="text-blue-500"
        >
          ← Назад
        </button>
        <h2>Новое сообщение</h2>
      </header>
      <div className="border-b border-gray-200">
        <input
          type="text"
          placeholder="Поиск пользователей..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
      <button
        onClick={() => navigate('/searchGroupMembers')}
        className="w-full p-2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
        + Новая группа
      </button>
      <div className="flex-1 overflow-y-auto">
        {loading && <p className="p-4 text-gray-500">Загрузка...</p>}
        {!loading && results.length === 0 && query.trim() && (
          <p className="p-4 text-gray-500">Никого не найдено</p>
        )}
        {results.map((user) => (
          <div
            key={user.id}
            onClick={() => handleStartChat(user.id)}
            className="flex items-center gap-3 p-4 border-b border-gray-100 active:bg-gray-50 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{user.username}</span>
          </div>
        ))}
      </div>
    </div>
  )
}