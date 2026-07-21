import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useChats } from '../hooks/useChats'
import { ChatListItem } from '../components/ChatListItem'
import { ChatsSkeleton } from '../components/ChatsSkeleton'
import { ErrorView } from '../components/ErrorView'
import { EmptyView } from '../components/EmptyView'
import { getChatKeys, getRoomKey, sendEncryptedMessage } from '../lib/api'
import { encryptMessage, encryptWithRoomKeyWebCrypto, decryptRoomKey, getPrivateKey } from '../lib/crypto'
import type { Message, Chat } from '../types'

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

  const handleForwardToChat = async (chat: Chat) => {
    if (!message || !currentUser) return

    // Формируем текст с указанием автора
    const forwardedText = `↪️ Пересланное сообщение от ${message.sender?.username || 'неизвестного'}:\n${message.content}`

    try {
      let encryptedContent = ''
      let iv = ''
      let authTag = ''
      let encKeySender = ''
      let encKeyRecipient = ''

      if (chat.type === 'private') {
        const keys = await getChatKeys(chat.id)
        if (!keys || keys.length === 0) {
          alert('Не удалось получить публичные ключи для этого чата.')
          return
        }
        const chatKeys: Record<number, string> = {}
        keys.forEach(k => { chatKeys[k.user_id] = k.public_key })

        const result = encryptMessage(forwardedText, 'private', chatKeys, currentUser.id)
        if (!result.encrypted_content) {
          alert('Не удалось зашифровать сообщение.')
          return
        }
        encryptedContent = result.encrypted_content
        iv = result.iv
        authTag = result.auth_tag
        encKeySender = result.encrypted_key_sender || ''
        encKeyRecipient = result.encrypted_key_recipient || ''
      } else if (chat.type === 'group') {
        const privateKey = getPrivateKey(currentUser.id)
        if (!privateKey) {
          alert('У вас нет приватного ключа.')
          return
        }
        const { encrypted_key } = await getRoomKey(chat.id)
        const decryptedRoomKey = decryptRoomKey(encrypted_key, privateKey)
        if (!decryptedRoomKey) {
          alert('Не удалось расшифровать ключ группы.')
          return
        }

        const result = await encryptWithRoomKeyWebCrypto(forwardedText, decryptedRoomKey)
        encryptedContent = result.encrypted_content
        iv = result.iv
        authTag = result.auth_tag
      }

      if (!encryptedContent) {
        alert('Не удалось зашифровать сообщение.')
        return
      }

      await sendEncryptedMessage(
        chat.id,
        forwardedText,                // ← открытый текст с автором
        encryptedContent,
        encKeySender,
        encKeyRecipient,
        iv,
        authTag
      )
      navigate(`/chats/${chat.id}`)
    } catch (err) {
      console.error('Forward failed', err)
      alert('Не удалось переслать сообщение.')
    }
  }

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
            onPress={() => handleForwardToChat(chat)}
          />
        ))}
      </ul>
    </div>
  )
}