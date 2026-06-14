import { useRef, useState } from 'react'
import { useSendMessage } from '../hooks/useSendMessage'
import { useWS } from '../contexts/WebSocketContext'

interface Props {
  chatId: number
}

export default function MessageInput({ chatId }: Props) {
  const { sendMessage } = useWS()
  console.log('sendMessage available:', !!sendMessage)

  const [text, setText] = useState('')
  const { mutate, isPending } = useSendMessage(chatId)
  const lastTypingSent = useRef(0)

  const handleSend = () => {
    if (!text.trim() || isPending) return
    mutate(text.trim(), {
      onSuccess: () => setText(''), // очищаем поле после успешной отправки
    })
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
    <div className="p-4 border-t border-gray-200 flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          handleTyping()
        }}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Сообщение..."
        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isPending}
      />
      <button
        onClick={handleSend}
        disabled={isPending || !text.trim()}
        className="bg-blue-500 text-white px-4 py-2 rounded-full disabled:opacity-50"
      >
        {isPending ? '...' : 'Отправить'}
      </button>
    </div>
  )
}