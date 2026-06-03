import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchUsers, createChat } from '../lib/api.ts'
import type { User } from '../types/index.ts'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Debounce-запрос при изменении query
  useEffect(() => {
    if(!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
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
        <div className="flex flex-col h-full">
      {/* Хедер с полем поиска */}
      <header className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Поиск пользователей..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </header>
      <button
          onClick={() => navigate('/searchGroupMembers')}
          className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg">
          + Новая группа
      </button>
      {/* Результаты поиска */}
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