import type { Chat } from "../types";

interface ChatListItemProps {
  chat: Chat;
  currentUserId: number;
  onPress: () => void;
  onlineUsers: number[];
}

// Функция для очистки превью сообщения от маркера цитаты
function cleanMessagePreview(text: string): string {
  // Ищем маркер цитаты вида "> [reply:123:Имя] текст\n\n"
  const match = text.match(/^> \[reply:\d+:.+?\] .+?\n\n/);
  if (match) {
    // Удаляем маркер и возвращаем текст ответа (обрезаем до 50 символов)
    const answer = text.slice(match[0].length);
    return '↩️ ' + (answer.length > 50 ? answer.slice(0, 50) + '...' : answer);
  }
  // Если цитаты нет, возвращаем исходный текст (тоже обрезаем для длинных сообщений)
  return text.length > 50 ? text.slice(0, 50) + '...' : text;
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
          <p className="text-sm text-gray-500 truncate">
            <span className="font-semibold">{chat.last_message.sender.username}: </span>
            {cleanMessagePreview(chat.last_message.content)}
          </p>
        ) : (
          <p className="text-sm text-gray-400 truncate">Нет сообщений</p>
        )}
      </div>
    </li>
  )
}