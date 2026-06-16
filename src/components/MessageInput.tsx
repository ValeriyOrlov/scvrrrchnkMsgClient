import { useRef, useState, useEffect } from 'react'
import { useSendMessage } from '../hooks/useSendMessage'
import { useUpdateMessage } from '../hooks/useUpdateMessage'
import { useWS } from '../contexts/WebSocketContext'
import type { Message } from '../types'

interface Props {
  chatId: number
  replyTo?: Message | null
  onCancelReply?: () => void
  editMessage?: Message | null
  onCancelEdit?: () => void
  onSaveEdit?: (messageId: number, content: string) => void
}

function extractReplyText(content: string): string {
  const match = content.match(/^> \[reply:\d+:.+?\] .+?\n\n/)
  return match ? content.slice(match[0].length).trim() : content.trim()
}

export default function MessageInput({ chatId, replyTo, onCancelReply, editMessage, onCancelEdit, onSaveEdit }: Props) {
  const { sendMessage } = useWS()
  console.log('sendMessage available:', !!sendMessage)

  const [text, setText] = useState('')
  const { mutate, isPending } = useSendMessage(chatId)
  const updateMutation = useUpdateMessage(chatId)

  const lastTypingSent = useRef(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isOverflow, setIsOverflow] = useState(false)


  // Фокус и установка текста при цитировании/редактировании
  useEffect(() => {
    if (editMessage) {
      const content = extractReplyText(editMessage.content)
      setText(content)
    }
    if (replyTo || editMessage) {
      textareaRef.current?.focus()
    }
  }, [replyTo, editMessage])

  // Авторасширение высоты и управление скроллбаром
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto' // сбрасываем, чтобы правильно рассчитать
    const lineHeight = 24 // примерная высота строки в пикселях (зависит от шрифта)
    const maxHeight = lineHeight * 5
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    setIsOverflow(textarea.scrollHeight > maxHeight)
  }, [text])

  const handleSend = () => {
    if (!text.trim()) return
    if (editMessage) {
      let finalContent = text.trim()
      const replyMatch = editMessage.content.match(/^> \[reply:\d+:.+?\] .+?\n\n/)
      if (replyMatch) {
        finalContent = replyMatch[0] + finalContent
      }
      updateMutation.mutate(
        { messageId: editMessage.id, content: finalContent },
        { onSuccess: () => { setText(''); onCancelEdit?.() } }
      )
    } else {
      let finalContent = text.trim()
      if (replyTo) {
        const replyText = extractReplyText(replyTo.content)
        finalContent = `> [reply:${replyTo.id}:${replyTo.sender.username}] ${replyText}\n\n${finalContent}`
      }
      mutate(finalContent, {
        onSuccess: () => { setText(''); onCancelReply?.() }
      })
    }
  }

  const handleTyping = () => {
    const now = Date.now()
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now
      console.log('Sending typing event')
      sendMessage({ type: 'typing', chat_id: chatId })
    }
  }

  return (
    <>
      {replyTo && (
        <div className="flex items-start gap-2 p-2 bg-gray-100 rounded-lg mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-600">{replyTo.sender.username}</p>
            <p className="text-sm text-gray-700 truncate">{extractReplyText(replyTo.content)}</p>
          </div>
          <button onClick={onCancelReply} className="text-gray-500 hover:text-red-500 text-sm">✕</button>
        </div>
      )}
      <div className="p-4 border-t border-gray-200 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            handleTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Сообщение..."
          className={`flex-1 border border-gray-300 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isOverflow ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
          rows={1}
          disabled={isPending}
          style={{ maxHeight: '120px' }} // fallback
        />
        <button
          onClick={handleSend}
          disabled={isPending || !text.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-full disabled:opacity-50 flex-shrink-0"
        >
          {isPending ? '...' : editMessage ? 'Сохранить' : 'Отправить'}
        </button>
      </div>
    </>
  )
}