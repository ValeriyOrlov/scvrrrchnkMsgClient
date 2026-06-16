import { useState, useEffect, useRef } from 'react'
import { useDeleteMessage } from '../hooks/useDeleteMessage'
import type { Message } from '../types'

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
// Вспомогательная функция для очистки цитируемого текста от вложенных маркеров
function cleanReplyText(text: string): string {
  const match = text.match(/^> \[reply:\d+:.+?\] (.+?)(?:\n\n|$)/)
  return match ? match[1].trim() : text.trim()
}

// Извлекает последний ответ, игнорируя все маркеры цитат
function extractLastReply(content: string): string {
  const parts = content.split('\n\n')
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!parts[i].startsWith('> [reply:')) {
      return parts[i].trim()
    }
  }
  return content.trim() // fallback
}

export default function MessageBubble({ message, isOwn, chatId, onReply, onForward, onEdit, onScrollToReply, messagesMap }: Props) {
  const [showActions, setShowActions] = useState(false)
  const deleteMutation = useDeleteMessage(chatId)
  const bubbleRef = useRef<HTMLDivElement>(null)

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

  const handleDelete = () => {
    if (window.confirm('Удалить сообщение?')) {
      deleteMutation.mutate(message.id)
      setShowActions(false)
    }
  }

  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const editingTime = new Date(message.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const wasEdited = message.updated_at !== message.created_at

  // Парсинг маркера цитаты
  let quoteAuthor = ''
  let quoteText = ''
  let replyTargetId: number | null = null
  let displayContent = message.content
  let quotedMessage: Message | undefined
  let replyMarker = ''

  const replyMatch = message.content.match(/^> \[reply:(\d+):(.+?)\] (.+?)\n\n/)
  if (replyMatch) {
    replyTargetId = parseInt(replyMatch[1])
    quoteAuthor = replyMatch[2]
    replyMarker = replyMatch[0]
    quoteText = cleanReplyText(replyMatch[3].trim())   // <-- применяем очистку
    displayContent = message.content.slice(replyMatch[0].length)
    quotedMessage = messagesMap?.get(replyTargetId)
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold text-sm mr-2 flex-shrink-0">
          {message.sender.username.charAt(0).toUpperCase()}
        </div>
      )}

      <div ref={bubbleRef} className="relative max-w-[75%]">
        <div
          onClick={() => setShowActions(!showActions)}
          className={`px-4 py-2 rounded-2xl cursor-pointer ${
            isOwn ? 'bg-blue-500 text-white rounded-br-md' : 'bg-gray-200 text-gray-900 rounded-bl-md'
          } ${showActions ? 'ring-2 ring-blue-300' : ''}`}
        >
          {replyTargetId && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onScrollToReply?.(replyTargetId!)
              }}
              className="bg-gray-100/70 border-l-2 border-blue-300 pl-2 pr-1 py-1 mb-2 rounded text-xs cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <span className="font-semibold text-blue-600">{quoteAuthor}</span>
              <p className="text-gray-600 italic truncate max-w-[200px]">
                {quotedMessage ? extractLastReply(quotedMessage.content) : 'Сообщение удалено'}
              </p>
            </div>
          )}

          <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
          <div className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            <span>{time}</span>
            {wasEdited && <span className="italic">(ред. {editingTime})</span>}
          </div>
        </div>

        {showActions && (
          <div className="absolute -top-10 right-0 flex gap-1 bg-white shadow-md rounded-full px-4 py-2 transition-opacity duration-200 z-10">
            <button onClick={(e) => { e.stopPropagation(); onReply?.(message); setShowActions(false); }} className="text-sm text-gray-600 hover:text-blue-500" title="Ответить">↩️</button>
            <button onClick={(e) => { e.stopPropagation(); onForward?.(message); setShowActions(false); }} className="text-sm text-gray-600 hover:text-green-500" title="Переслать">↪️</button>
            {isOwn && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onEdit?.(message); setShowActions(false); }} className="text-sm text-gray-600 hover:text-blue-500" title="Редактировать">✏️</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-sm text-gray-600 hover:text-red-500" title="Удалить">🗑️</button>
              </>
            )}
          </div>
        )}
      </div>

      {isOwn && (
        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-white font-bold text-sm ml-2 flex-shrink-0">
          {message.sender.username.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}