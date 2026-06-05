import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth.ts'
import { useChat } from '../hooks/useChat.ts'
import { searchUsers, addMembersToChat, leaveChat } from '../lib/api.ts'
import type { User } from '../types/index.ts'

export default function ChatInfoPage() {
  const { id } = useParams<{ id: string }>()
  const chatId = parseInt(id!)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const { data: chat, isLoading } = useChat(chatId)

  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    const users = await searchUsers(q)
    setSearchResults(users)
  }

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return
    const memberIds = selectedUsers.map(u => u.id)
    try {
      await addMembersToChat(chatId, memberIds)
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
      setSelectedUsers([])
      setShowSearch(false)
    } catch (err) {
      console.error('Add members failed', err)
    }
  }

  if (isLoading) return <div className="p-4">Загрузка...</div>
  if (!chat) return <div className="p-4">Чат не найден</div>

  const displayName = chat.type === 'private'
    ? chat.members?.find(m => m.user?.id !== currentUser?.id)?.user?.username || 'Приватный чат'
    : chat.chat_name || 'Группа'

  const handleLeaveChat = async () => {
  if (!confirm('Вы уверены, что хотите покинуть чат?')) return
  try {
    await leaveChat(chatId)
    queryClient.invalidateQueries({ queryKey: ['chats'] })
    navigate('/chats', { replace: true })
  } catch (err) {
    console.error('Leave chat failed', err)
  }
}
  
  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-blue-500">← Назад</button>
        <h2 className="text-lg font-semibold">{displayName}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-semibold mb-2">Участники ({chat.members.length})</h3>
        {chat.members.map(member => (
          <div key={member.id} className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold">
              {member.user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <span>{member.user?.username || 'Неизвестный'}</span>
            {member.role === 'admin' && <span className="text-xs text-gray-500">(админ)</span>}
          </div>
        ))}

        {chat.type === 'group' && (
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Добавить участников
          </button>
        )}

        {showSearch && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map(user => (
                <span key={user.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {user.username}
                  <button onClick={() => handleRemoveUser(user.id)} className="ml-1 text-blue-500">×</button>
                </span>
              ))}
            </div>
            <button
              onClick={handleAddMembers}
              disabled={selectedUsers.length === 0}
              className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Добавить
            </button>
            <div className="mt-2">
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleAddUser(user)}
                  className="flex items-center gap-3 p-2 border-b border-gray-100 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={handleLeaveChat}
          className="mt-4 w-full bg-red-500 text-white py-2 rounded disabled:opacity-50"
        >
          Покинуть чат
        </button>
      </div>
    </div>
  )
}