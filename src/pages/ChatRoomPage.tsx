import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { useMessages } from '../hooks/useMessages'
import { useUpdateMessage } from '../hooks/useUpdateMessage'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import bgPattern from '../assets/images/messages-box-background-blue.jpg'
import { useTypingStore } from '../store/typingStore'
import { markAsRead, getChatKeys, getRoomKey } from '../lib/api'
import { decryptRoomKey } from '../lib/crypto'
import { getPrivateKey } from '../lib/crypto'
import type { Message } from '../types'

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const chatId = parseInt(id!)
  const { data: messages, isPending: isMessagesLoading, isError } = useMessages(chatId)
  const { data: chat, isPending: isChatLoading } = useChat(chatId)

  const location = useLocation()

  useEffect(() => {
    const state = location.state as { forwardMessage?: Message } | null
    if (state?.forwardMessage) {
      setReplyTo(state.forwardMessage)
      navigate('.', { replace: true, state: {} })
    }
  }, [location])

  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editMessage, setEditMessage] = useState<Message | null>(null)

  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const updateMutation = useUpdateMessage(chatId)

  const typingUsers = useTypingStore(
    useShallow((state) => state.typing[chatId] || [])
  )

  const reversedMessages = useMemo(() => messages ? [...messages].reverse() : [], [messages])

  useEffect(() => {
    if (!messages || messages.length === 0) return
    const maxId = Math.max(...messages.map(m => m.id))
    markAsRead(chatId, maxId).catch(console.error)
  }, [messages, chatId])

  const otherTypingUsers = useMemo(
    () => typingUsers.filter((id: number) => id !== user?.id),
    [typingUsers, user?.id]
  )

  const displayName = useMemo(() => {
    if (!chat) return ''
    if (chat.type === 'private') {
      const otherMember = chat.members?.find(m => m.user?.id !== user?.id)
      return otherMember?.user?.username || 'Приватный чат'
    }
    return chat.chat_name || 'Группа'
  }, [chat, user?.id])

  const typingText = useMemo(() => {
    if (otherTypingUsers.length === 0) return ''
    if (chat?.type === 'private') return 'печатает...'
    return otherTypingUsers
      .map(id => chat?.members?.find(m => m.user.id === id)?.user?.username || 'Кто-то')
      .join(', ') + ' печатает...'
  }, [otherTypingUsers, chat])

  const scrollToMessage = (messageId: number) => {
    const el = messageRefs.current[messageId]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-blue-400')
    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 2000)
  }

  // Публичные ключи участников (для личных чатов)
  const [chatKeys, setChatKeys] = useState<Record<number, string>>({})

  // Room Key для группового чата (расшифрованный)
  const [roomKey, setRoomKey] = useState<string | null>(null)

  useEffect(() => {
    if (!chatId) return
    getChatKeys(chatId)
      .then(keys => {
        console.log('Chat keys loaded:', keys)
        const map: Record<number, string> = {}
        keys.forEach(k => { map[k.user_id] = k.public_key })
        setChatKeys(map)
      })
      .catch(err => console.error('Failed to load chat keys', err))
  }, [chatId])

  // Загрузка Room Key для группового чата
  useEffect(() => {
    if (!chat || chat.type !== 'group') {
      setRoomKey(null)
      return
    }
    const privKey = user ? getPrivateKey(user.id) : null
    if (!privKey) {
      setRoomKey(null)
      return
    }
    console.log('Loading room key for chat', chatId)
    getRoomKey(chatId)
      .then(data => {
        console.log('Room key loaded:', data.encrypted_key)
        const decrypted = decryptRoomKey(data.encrypted_key, privKey)
        setRoomKey(decrypted)
      })
      .catch(err => {
        console.error('Failed to load room key', err)
        setRoomKey(null)
      })
  }, [chat, chatId, user])

  const handleStartEdit = (msg: Message) => {
    setReplyTo(null)
    setEditMessage(msg)
  }

  const handleCancelEdit = () => setEditMessage(null)

  const handleSaveEdit = (messageId: number, content: string) => {
    updateMutation.mutate({ messageId, content })
    setEditMessage(null)
  }

  const handleForward = (msg: Message) => {
    navigate('/forward', { state: { message: msg, excludeChatId: chatId } })
  }

  if (isChatLoading || isMessagesLoading) return <div className="p-4">Загрузка...</div>
  if (isError) return <div className="p-4 text-red-500">Ошибка загрузки сообщений</div>

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 justify-between">
        <button onClick={() => navigate('/chats', { replace: true })} className="text-blue-500">
          ← Назад
        </button>
        <div>
          <h2 className="text-lg font-semibold truncate">{displayName}</h2>
          {typingText ? (
            <p className="text-sm text-gray-500 italic">{typingText}</p>
          ) : (
            <p className="text-sm text-gray-500 italic invisible" aria-hidden="true">
              &nbsp;
            </p>
          )}
        </div>
        <span
          className='cursor-pointer'
          onClick={() => navigate(`/chats/${chatId}/info`)}
        >
          chat info
        </span>
      </header>
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          backgroundImage: `url(${bgPattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px'
        }}
      >
        {reversedMessages &&
          <MessageList 
            messages={reversedMessages}
            currentUserId={user!.id}
            chatId={chatId}
            onReply={setReplyTo}
            onEdit={handleStartEdit}
            onForward={handleForward}
            onScrollToReply={scrollToMessage}
            messageRefs={messageRefs}
            roomKey={roomKey}
            chatType={chat?.type}
          />
        }
      </div>
      <div className="flex-shrink-0">
        <MessageInput
          chatId={chatId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editMessage={editMessage}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          chatKeys={chatKeys}
          roomKey={roomKey}
          chatType={chat?.type ?? 'private'}
        />
      </div>
    </div>
  )
}