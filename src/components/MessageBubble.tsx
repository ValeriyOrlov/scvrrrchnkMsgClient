import { useState, useEffect, useRef, useMemo } from 'react'
import { useDeleteMessage } from '../hooks/useDeleteMessage'
import type { Message } from '../types'
import ConfirmModal from './ConfirmModal'
import { getPrivateKey, decryptMessage, decryptMessageWithRoomKey } from '../lib/crypto'
import useAuthStore from '../store/authStore'

interface Props {
  message: Message
  isOwn: boolean
  chatId: number
  onReply?: (msg: Message) => void
  onForward?: (msg: Message) => void
  onEdit?: (msg: Message) => void
  messagesMap?: Map<number, Message>
  roomKey?: string | null
  chatType?: 'private' | 'group'
}

export default function MessageBubble({ message, isOwn, chatId, onReply, onForward, onEdit, roomKey, chatType }: Props) {
  const [showActions, setShowActions] = useState(false)
  const [menuBelow, setMenuBelow] = useState(true)
  const deleteMutation = useDeleteMessage(chatId)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const currentUser = useAuthStore(state => state.user)
  const privateKey = currentUser ? getPrivateKey(currentUser.id) : null

  const baseContent = useMemo(() => {
    if (isOwn && message.content) return message.content
    if (!message.encrypted_content || !message.iv || !message.auth_tag) return message.content || 'Сообщение'
    if (!privateKey) return 'Зашифрованное сообщение (нет ключа)'
    if (chatType === 'group' && roomKey) {
      try { return decryptMessageWithRoomKey(message.encrypted_content, message.iv, message.auth_tag, roomKey) }
      catch (e) { return 'Ошибка расшифровки' }
    }
    const encryptedKey = isOwn ? message.encrypted_key_sender : message.encrypted_key_recipient
    if (encryptedKey) {
      try { return decryptMessage(message.encrypted_content, encryptedKey, message.iv, message.auth_tag, privateKey) }
      catch (e) { return 'Ошибка расшифровки' }
    }
    return message.content || 'Сообщение'
  }, [message, isOwn, privateKey, roomKey, chatType])

  // Парсим цитату
  const fullMatch = baseContent?.match(/^\[reply_to:(\d+)\]\n┌(.+?)\n│ (.+?)\n└──\n/s)
  const replyTargetId = fullMatch ? parseInt(fullMatch[1]) : null
  const quoteAuthor = fullMatch ? fullMatch[2] : null
  const quoteText = fullMatch ? fullMatch[3] : null
  const replyText = fullMatch ? baseContent!.slice(fullMatch[0].length) : baseContent

  const displayContent = replyText || baseContent || ''

  useEffect(() => {
    if (!showActions) return
    const handleClick = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) setShowActions(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showActions])

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
      <button onClick={(e) => { e.stopPropagation(); onReply?.({ ...message, content: baseContent || '' }); setShowActions(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 rounded-xl text-gray-700">↩️ Ответить</button>
      <button onClick={(e) => { e.stopPropagation(); onForward?.({ ...message, content: baseContent || '' }); setShowActions(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 rounded-xl text-gray-700">↪️ Переслать</button>
      {isOwn && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onEdit?.(message); setShowActions(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 rounded-xl text-gray-700">✏️ Редактировать</button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 rounded-xl text-red-500">🗑️ Удалить</button>
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
            isOwn ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-900 rounded-bl-md'
          } ${showActions ? 'ring-2 ring-blue-300' : ''}`}
        >
          {quoteAuthor && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                const targetId = e.currentTarget.getAttribute('data-reply-to')
                if (targetId) {
                  const target = document.getElementById(`msg-${targetId}`)
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    target.classList.add('highlight-pulse')
                    setTimeout(() => target.classList.remove('highlight-pulse'), 2000)
                  }
                }
              }}
              data-reply-to={replyTargetId || undefined}
              className="bg-black/5 border-l-2 border-blue-400 pl-2 pr-1 py-1 mb-2 rounded text-xs cursor-pointer hover:bg-black/10 transition-colors"
            >
              <span className="font-bold text-blue-800">{quoteAuthor}</span>
              <p className="text-gray-400 italic mt-0.5">{quoteText}</p>
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