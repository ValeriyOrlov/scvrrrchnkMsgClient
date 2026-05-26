import type { Message } from '../types'

interface Props {
  messages: Message[]
  currentUserId: number
}

export default function MessageList({ messages, currentUserId }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map(msg => {
        const isOwn = msg.sender_id === currentUserId
        return (
          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {!isOwn && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm font-bold">
                  {msg.sender.username.charAt(0).toUpperCase()}
                </div>
                <div className="max-w-xs">
                  <p className="text-sm font-medium text-gray-600">{msg.sender.username}</p>
                  <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none">
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            )}
            {isOwn && (
              <div className="max-w-xs bg-blue-500 text-white p-3 rounded-lg rounded-tr-none">
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-blue-100 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}