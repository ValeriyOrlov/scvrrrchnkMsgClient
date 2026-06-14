import { useState } from 'react'
import { useUpdateMessage } from '../hooks/useUpdateMessage'
import { useDeleteMessage } from '../hooks/useDeleteMessage'
import type { Message } from '../types'

interface Props {
  message: Message
  isOwn: boolean
  chatId: number
}

export default function MessageBubble({ message, isOwn, chatId }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showActions, setShowActions] = useState(false)
  const updateMutation = useUpdateMessage(chatId)
  const deleteMutation = useDeleteMessage(chatId)

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      updateMutation.mutate({ messageId: message.id, content: editContent.trim() })
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm('Удалить сообщение?')) {
      deleteMutation.mutate(message.id)
    }
  }

  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold text-sm mr-2 flex-shrink-0">
          {message.sender.username.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="relative group max-w-[75%]">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') setIsEditing(false)
              }}
            />
            <button onClick={handleSaveEdit} className="text-blue-500 text-sm font-medium">✓</button>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 text-sm">✕</button>
          </div>
        ) : (
          <div className={`px-4 py-2 rounded-2xl ${isOwn ? 'bg-blue-500 text-white rounded-br-md' : 'bg-gray-200 text-gray-900 rounded-bl-md'} ${showActions ? 'ring-2 ring-blue-300' : ''}`}
            onClick={() => isOwn && setShowActions(!showActions)}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>{time}</p>
          </div>
        )}

        {isOwn && !isEditing && (
          <div
            className={`absolute -top-5 right-0 flex gap-1 bg-white shadow-md rounded-full px-4 py-2 transition-opacity duration-200 ${
              showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 hidden md:flex'
            }`}
          >
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-xs text-gray-500 hover:text-blue-500" title="Редактировать">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-xs text-gray-500 hover:text-red-500" title="Удалить">🗑️</button>
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