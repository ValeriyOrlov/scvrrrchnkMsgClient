import { useOnlineUsers } from "../hooks/useOnlineUsers";
import type { Chat } from "../types";

interface ChatListItemProps {
  chat: Chat
  currentUserId: number
  onPress: () => void
}

export function ChatListItem({ chat, currentUserId, onPress }: ChatListItemProps) {
  let displayName: string
  const otherMember = chat.members?.find(m => m.user?.id !== undefined && m.user.id !== currentUserId)

  if (chat.type === 'private') {
    displayName = otherMember?.user?.username || 'Приватный чат'
  } else {
    displayName = chat.chat_name || 'Группа'
  }

  const avatarLetter = displayName.charAt(0).toUpperCase()
  const { data: onlineUsers } = useOnlineUsers()
  const isOnline = onlineUsers?.includes(otherMember?.user_id)
  return (
    <li
      onClick={onPress}
      className="flex items-center gap-3 p-4 border-b border-gray-100 active:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
        {avatarLetter}
      </div>
        {isOnline && <span className="w-2 h-2 bg-green-500 rounded-full inline-block ml-1" />}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{displayName}</p>
        {chat.last_message ? (
          <p className="text-sm text-gray-500 truncate">
            <span className="font-semibold">{chat.last_message.sender.username}: </span>
            {chat.last_message.content}
          </p>
        ) : (
          <p className="text-sm text-gray-400 truncate">Нет сообщений</p>
        )}
      </div>
    </li>
  )
}