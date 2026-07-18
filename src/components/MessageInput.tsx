import { useRef, useState, useEffect } from 'react'
import { useSendMessage } from '../hooks/useSendMessage'
import { useUpdateMessage } from '../hooks/useUpdateMessage'
import { useWS } from '../contexts/WebSocketContext'
import { encryptMessage } from '../lib/crypto'
import useAuthStore from '../store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import type { Message } from '../types'

interface Props {
  chatId: number
  replyTo?: Message | null
  onCancelReply?: () => void
  editMessage?: Message | null
  onCancelEdit?: () => void
  onSaveEdit?: (messageId: number, content: string) => void
  chatKeys: Record<number, string>
  roomKey?: string | null
  chatType?: 'private' | 'group'
}

function extractReplyText(content: string): string {
  const match = content.match(/^> \[reply:\d+:.+?\] .+?\n\n/)
  return match ? content.slice(match[0].length).trim() : content.trim()
}

export default function MessageInput({
  chatId,
  replyTo,
  onCancelReply,
  editMessage,
  onCancelEdit,
  chatKeys,
  roomKey,
  chatType,
}: Props) {
  const { sendMessage } = useWS()
  const [text, setText] = useState('')
  const { mutate, isPending } = useSendMessage(chatId)
  const updateMutation = useUpdateMessage(chatId)
  const currentUser = useAuthStore(state => state.user)
  const queryClient = useQueryClient()

  const lastTypingSent = useRef(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isOverflow, setIsOverflow] = useState(false)

  useEffect(() => {
    if (editMessage) {
      const content = extractReplyText(editMessage.content)
      setText(content)
    }
    if (replyTo || editMessage) {
      textareaRef.current?.focus()
    }
  }, [replyTo, editMessage])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const lineHeight = 24
    const maxHeight = lineHeight * 5
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    setIsOverflow(textarea.scrollHeight > maxHeight)
  }, [text])

  const handleSend = () => {
    if (!text.trim() || !currentUser) return

    let finalContent = text.trim()
    // цитирование
    if (!editMessage && replyTo) {
      const replyText = extractReplyText(replyTo.content)
      finalContent = `> [reply:${replyTo.id}:${replyTo.sender.username}] ${replyText}\n\n${finalContent}`
    }
    // редактирование
    if (editMessage) {
      let contentToSave = text.trim()
      const replyMatch = editMessage.content.match(/^> \[reply:\d+:.+?\] .+?\n\n/)
      if (replyMatch) {
        contentToSave = replyMatch[0] + contentToSave
      }


      const encryptedPayload = encryptMessage(contentToSave, chatType ?? 'private', chatKeys, currentUser.id, roomKey)


      updateMutation.mutate(
        {
          messageId: editMessage.id,
          content: contentToSave,   // будет использован для кэша, но на сервер не попадёт
          encrypted: encryptedPayload,
        },
        { onSuccess: () => { setText(''); onCancelEdit?.() } }
      )
      return
    }

    // Отправка нового сообщения
    const encryptedPayload = encryptMessage(finalContent, chatType ?? 'private', chatKeys, currentUser.id, roomKey)

    // Добавляем сообщение в кэш мгновенно (без ожидания ответа сервера)
   const tempMessage: Message = {
      id: Date.now(),
      chat_id: chatId,
      sender_id: currentUser.id,
      content: finalContent,
      encrypted_content: encryptedPayload?.encrypted_content ?? '',
      encrypted_key_sender: encryptedPayload?.encrypted_key_sender ?? '',
      encrypted_key_recipient: encryptedPayload?.encrypted_key_recipient ?? '',
      iv: encryptedPayload?.iv ?? '',
      auth_tag: encryptedPayload?.auth_tag ?? '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: { id: currentUser.id, username: currentUser.username }
    }
    queryClient.setQueryData(['messages', chatId], (old: Message[] = []) => [...old, tempMessage])

    mutate(
      { content: finalContent, encrypted: encryptedPayload },
      {
        onSuccess: () => {
          setText('')
          onCancelReply?.()
          queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
        }
      }
    )
  }

  const handleTyping = () => {
    const now = Date.now()
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now
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
          style={{ maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={isPending || !text.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-full disabled:opacity-50 flex-shrink-0"
        >
          {isPending ? '...' : editMessage ? 'Сохранить' : 'Чирикнуть'}
        </button>
      </div>
    </>
  )
}