import { useState, useEffect, useRef, useMemo } from 'react'
import { useDeleteMessage } from '../hooks/useDeleteMessage'
import type { Message } from '../types'
import { getMessageById } from '../lib/api'
import ConfirmModal from './ConfirmModal'
import { getPrivateKey, decryptMessage } from '../lib/crypto'
import useAuthStore from '../store/authStore'

interface Props {
  message: Message
  isOwn: boolean
  chatId: number
  onReply?: (msg: Message) => void
  onForward?: (msg: Message) => void
  onEdit?: (msg: Message) => void
  onScrollToReply?: (messageId: number) => void
  messagesMap?: Map<number, Message>
}

function extractLastReply(content: string): string {
  const parts = content.split('\n\n')
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!parts[i].startsWith('> [reply:')) {
      return parts[i].trim()
    }
  }
  return content.trim()
}

export default function MessageBubble({ message, isOwn, chatId, onReply, onForward, onEdit, onScrollToReply, messagesMap }: Props) {
  const [showActions, setShowActions] = useState(false)
  const [menuBelow, setMenuBelow] = useState(true)
  const deleteMutation = useDeleteMessage(chatId)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [fetchedQuotedMessage, setFetchedQuotedMessage] = useState<Message | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const currentUser = useAuthStore(state => state.user)
  const privateKey = currentUser ? getPrivateKey(currentUser.id) : null

  // 1. Расшифровываем (или берём открытый текст) базу сообщения
const baseContent = useMemo(() => {
  // Для своих сообщений всегда показываем content (открытый текст из кэша)
  if (isOwn && message.content) {
    return message.content
  }
  // Для чужих или если content пуст – расшифровываем
  if (message.encrypted_content && message.iv && message.auth_tag && privateKey) {
    const encryptedKey = isOwn
      ? message.encrypted_key_sender
      : message.encrypted_key_recipient
    if (encryptedKey) {
      const decrypted = decryptMessage(
        message.encrypted_content,
        encryptedKey,
        message.iv,
        message.auth_tag,
        privateKey
      )
      return decrypted ?? 'Ошибка расшифровки'
    }
  }
  return message.content || 'Сообщение'
}, [message, isOwn, privateKey])

  // 2. Парсим маркер цитаты и строим финальный отображаемый текст
  let quoteAuthor = ''
  let quoteText = ''
  let replyTargetId: number | null = null
  let quotedMessage: Message | undefined

  const replyMatch = baseContent.match(/^> \[reply:(\d+):(.+?)\] (.+?)\n\n/)
  const displayContent = replyMatch
    ? baseContent.slice(replyMatch[0].length)   // текст после цитаты
    : baseContent

  if (replyMatch) {
    replyTargetId = parseInt(replyMatch[1])
    quoteAuthor = replyMatch[2]
    quoteText = replyMatch[3].trim()
    quotedMessage = messagesMap?.get(replyTargetId)
  }

  const displayQuotedContent = quotedMessage
    ? extractLastReply(quotedMessage.content)
    : fetchedQuotedMessage
      ? extractLastReply(fetchedQuotedMessage.content)
      : (quoteText || 'Сообщение удалено')

  // Закрытие меню при клике вне
  useEffect(() => {
    if (!showActions) return
    const handleClick = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setShowActions(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showActions])

  // Загрузка сообщения по ID, если его нет в текущем чате
  useEffect(() => {
    if (replyTargetId && !quotedMessage && !fetchedQuotedMessage) {
      getMessageById(replyTargetId)
        .then(msg => setFetchedQuotedMessage(msg))
        .catch(() => setFetchedQuotedMessage(null))
    }
  }, [replyTargetId, quotedMessage, fetchedQuotedMessage])

  const toggleMenu = () => {
    if (!showActions) {
      const rect = bubbleRef.current?.getBoundingClientRect()
      if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom
        setMenuBelow(spaceBelow >= 150)
      }
    }
    setShowActions(!showActions)
  }

  const handleDelete = () => setShowDeleteConfirm(true)

  const confirmDelete = () => {
    deleteMutation.mutate(message.id)
    setShowDeleteConfirm(false)
    setShowActions(false)
  }

  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const editingTime = new Date(message.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const wasEdited = message.updated_at !== message.created_at

  const menuItems = (
    <div className="absolute left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-2xl py-2 px-1 text-sm z-10 whitespace-nowrap"
         style={{ [menuBelow ? 'top' : 'bottom']: 'calc(100% + 4px)' }}>
      <button onClick={(e) => { e.stopPropagation(); onReply?.(message); setShowActions(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 rounded-xl text-gray-700">
        ↩️ Ответить
      </button>
      <button onClick={(e) => { e.stopPropagation(); onForward?.(message); setShowActions(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 rounded-xl text-gray-700">
        ↪️ Переслать
      </button>
      {isOwn && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onEdit?.(message); setShowActions(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 rounded-xl text-gray-700">
            ✏️ Редактировать
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 rounded-xl text-red-500">
            🗑️ Удалить
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold text-sm mr-2 flex-shrink-0">
          {message.sender.username.charAt(0).toUpperCase()}
        </div>
      )}

      <div ref={bubbleRef} className="relative max-w-[75%]">
        <div
          onClick={toggleMenu}
          className={`px-4 py-2 rounded-2xl cursor-pointer ${
            isOwn ? 'bg-blue-500 text-white rounded-br-md' : 'bg-gray-200 text-gray-900 rounded-bl-md'
          } ${showActions ? 'ring-2 ring-blue-300' : ''}`}
        >
          {replyTargetId && (
            <div
              onClick={(e) => { e.stopPropagation(); onScrollToReply?.(replyTargetId!) }}
              className="bg-gray-100/70 border-l-2 border-blue-300 pl-2 pr-1 py-1 mb-2 rounded text-xs cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <span className="font-semibold text-blue-600">{quoteAuthor}</span>
              <p className="text-gray-600 italic truncate max-w-[200px]">
                {displayQuotedContent}
              </p>
            </div>
          )}

          <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
          <div className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            <span>{time}</span>
            {wasEdited && <span className="italic">(ред. {editingTime})</span>}
          </div>
        </div>

        {showActions && menuItems}
      </div>

      {isOwn && (
        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-white font-bold text-sm ml-2 flex-shrink-0">
          {message.sender.username.charAt(0).toUpperCase()}
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Удалить сообщение?"
        message="Это действие нельзя отменить. Сообщение будет удалено для всех участников."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}