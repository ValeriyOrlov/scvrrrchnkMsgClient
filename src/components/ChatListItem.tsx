import type { Chat } from "../types";

interface ChatListItemProps {
  chat: Chat;
  currentUserId: number;
  onPress: () => void;
  onlineUsers: number[];
}

// Удаляет маркер цитаты, возвращает чистый ответ (или весь текст, если цитаты нет)
function cleanReplyMarker(text: string): string {
  const match = text.match(/^> \[reply:\d+:.+?\] (.+?)\n\n/);
  if (match) {
    return '↩️ ' + match[1].trim();
  }
  return text;
}

// Форматирует время в чч:мм
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatListItem({ chat, currentUserId, onPress, onlineUsers }: ChatListItemProps) {
  let displayName: string;
  let isOnline = false;

  if (chat.type === 'private') {
    const otherMember = chat.members?.find(m => m.user?.id !== undefined && m.user.id !== currentUserId);
    displayName = otherMember?.user?.username || 'Приватный чат';
    isOnline = otherMember ? onlineUsers?.includes(otherMember.user.id) : false;
  } else {
    displayName = chat.chat_name || 'Группа';
  }

  const avatarLetter = displayName.charAt(0).toUpperCase();
  // Вычисляем время последнего сообщения (если есть)
  let lastTime = '';
  let wasEdited = false;
  let messagePreview = '';
  let senderName = '';

  if (chat.last_message) {
    lastTime = formatTime(chat.last_message.updated_at); // показываем время последнего изменения
    wasEdited = chat.last_message.updated_at !== chat.last_message.created_at;
    messagePreview = cleanReplyMarker(chat.last_message.content);
    senderName = chat.last_message.sender.username;
  }

  return (
    <li
      onClick={onPress}
      className="flex items-center gap-3 p-4 border-b border-gray-100 active:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
        isOnline 
          ? 'bg-green-500 ring-2 ring-green-300 ring-offset-2 ring-offset-white' 
          : 'bg-blue-200'
      }`}>
        {avatarLetter}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{displayName}</p>
        {chat.last_message ? (
          <div className="flex justify-between items-baseline gap-1 text-sm text-gray-500">
            <span className="truncate min-w-0">
              <span className="font-semibold">{senderName}: </span>
              {messagePreview}
            </span>
            <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
              {lastTime}{wasEdited && <span className="italic"> (ред.)</span>}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-400 truncate">Нет сообщений</p>
        )}
      </div>
    </li>
  )
}