import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchUsers, createChat, saveRoomKey, getUserPublicKey } from '../lib/api.ts'
import { generateRoomKey, encryptRoomKey } from '../lib/crypto'
import { useAuth } from '../hooks/useAuth.ts'
import type { User } from '../types/index.ts'

export default function SearchGroupMembersPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

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

  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const removeUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const handleUserClick = (user: User) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      removeUser(user.id)
    } else {
      addUser(user)
    }
  }

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0 || !currentUser) return
    console.log('selectedUsers:', selectedUsers.map(u => ({ id: u.id, username: u.username })));
    const memberIds = selectedUsers.map(u => u.id)
    try {
      const chat = await createChat('group', groupName || '', memberIds)
      const roomKey = generateRoomKey()

      // Сохраняем Room Key для создателя
      const creatorPublicKey = await getUserPublicKey(currentUser.id)
      if (!creatorPublicKey) {
        alert('У вас нет публичного ключа. Перезайдите в аккаунт.')
        return
      }
      const encryptedCreator = encryptRoomKey(roomKey, creatorPublicKey)
      await saveRoomKey(chat.id, currentUser.id, encryptedCreator)
      console.log(`Room key saved for creator (user ${currentUser.id})`)

      // Сохраняем Room Key для каждого выбранного участника
      for (const user of selectedUsers) {
        console.log(`Loop iteration: user.id=${user.id}, currentUser.id=${currentUser.id}`);
        if (user.id === currentUser.id) {
          console.log(`Skipping creator (user ${user.id})`);
          continue;
        }
        console.log(`Processing user ${user.id} (${user.username})`);
        const publicKey = await getUserPublicKey(user.id);
        console.log(`Public key for user ${user.id}: ${!!publicKey}`);
        if (publicKey) {
          const encrypted = encryptRoomKey(roomKey, publicKey);
          await saveRoomKey(chat.id, user.id, encrypted);
          console.log(`Room key saved for user ${user.id}`);
        } else {
          console.error(`No public key for user ${user.id}`);
          alert(`Пользователь ${user.username} ещё не настроил шифрование.`);
          return;
        }
      }
      navigate(`/chats/${chat.id}`)
    } catch (err) {
      console.error('Create group failed', err)
    }
  }

  return (
        <div className="flex flex-col h-full p-4 gap-2">
      {/* Хедер с полем поиска */}
      <header className="pb-2">
        <input
          type="text"
          placeholder="Поиск пользователей..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </header>
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200">
          {selectedUsers.map(user => (
            <div key={user.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
              <span className="w-5 h-5 rounded-full bg-blue-300 flex items-center justify-center text-white text-xs font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
              {user.username}
              <button
                onClick={(e) => { e.stopPropagation(); removeUser(user.id) }}
                className="ml-1 text-blue-500 hover:text-blue-700 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {selectedUsers.length > 0 && (
        <div className="p-2 border-b border-gray-200">
          <input
            type="text"
            placeholder="Название группы (необязательно)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      <button
        onClick={handleCreateGroup}
        disabled={selectedUsers.length === 0}
        className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
          + Создать группу ({selectedUsers.length})
      </button>
      {/* Результаты поиска */}
      <div className="flex-1 overflow-y-auto">
        {loading && <p className="p-4 text-gray-500">Загрузка...</p>}
        {!loading && results.length === 0 && query.trim() && (
          <p className="p-4 text-gray-500">Никого не найдено</p>
        )}
        {results.map((user) => {
          const isSelected = selectedUsers.some(u => u.id === user.id)
          return (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className={`flex items-center gap-3 p-4 border-b border-gray-100 active:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
            >
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{user.username}</span>
              {isSelected && <span className="ml-auto text-blue-500">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}