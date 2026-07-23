import type { Chat } from "../types";
import { getPrivateKey, decryptMessage } from '../lib/crypto'
import useAuthStore from '../store/authStore'

interface ChatListItemProps {
  chat: Chat;
  currentUserId: number;
  onPress: () => void;
  onlineUsers: number[];
}

// Извлекает текст комментария к цитате (всё, что после └──)
function extractReplyPreview(text: string): string {
  const match = text.match(/\n└──\n(.+)/s)
  if (match) {
    return '↩️ ' + match[1].trim()
  }
  return text
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatListItem({ chat, currentUserId, onPress, onlineUsers }: ChatListItemProps) {
  let displayName: string;
  let isOnline = false;
  const currentUser = useAuthStore(state => state.user)
  const privateKey = currentUser ? getPrivateKey(currentUser.id) : null

  if (chat.type === 'private') {
    const otherMember = chat.members?.find(m => m.user?.id !== undefined && m.user.id !== currentUserId);
    displayName = otherMember?.user?.username || 'Приватный чат';
    isOnline = otherMember ? onlineUsers?.includes(otherMember.user.id) : false;
  } else {
    displayName = chat.chat_name || 'Группа';
  }

  const avatarLetter = displayName.charAt(0).toUpperCase();

  let lastTime = '';
  let wasEdited = false;
  let messagePreview = '';
  let senderName = '';

  if (chat.last_message) {
    lastTime = formatTime(chat.last_message.updated_at);
    wasEdited = chat.last_message.updated_at !== chat.last_message.created_at;
    senderName = chat.last_message.sender.username;

    // Пытаемся расшифровать, если есть зашифрованные поля и ключ
    if (chat.last_message.content) {
      // Открытый текст есть (старое сообщение или для отправителя)
      messagePreview = extractReplyPreview(chat.last_message.content);
    } else if (
      chat.last_message.encrypted_content &&
      chat.last_message.iv &&
      chat.last_message.auth_tag &&
      privateKey
    ) {
      const encryptedKey =
        chat.last_message.sender_id === currentUser?.id
          ? chat.last_message.encrypted_key_sender
          : chat.last_message.encrypted_key_recipient;
      if (encryptedKey) {
        const decrypted = decryptMessage(
          chat.last_message.encrypted_content,
          encryptedKey,
          chat.last_message.iv,
          chat.last_message.auth_tag,
          privateKey
        );
        if (decrypted) {
          messagePreview = extractReplyPreview(decrypted);
        } else {
          messagePreview = 'Зашифрованное сообщение';
        }
      } else {
        messagePreview = 'Зашифрованное сообщение';
      }
    } else if (chat.last_message.encrypted_content && !privateKey) {
      messagePreview = 'Зашифрованное сообщение (нет ключа)';
    }
  }

  // Определяем непрочитанные сообщения
  const currentMember = chat.members?.find(m => m.user_id === currentUserId)
  const lastReadId = currentMember?.last_read_message_id ?? 0
  const lastMessageId = chat.last_message?.id ?? 0
  const hasUnread = lastMessageId > lastReadId

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
        <div className="flex items-center gap-2">
          <p className={`truncate ${hasUnread ? 'font-bold text-black' : 'font-medium'}`}>{displayName}</p>
          {hasUnread && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
        </div>
        {chat.last_message ? (
          <div className="flex justify-between items-baseline gap-1 text-sm text-gray-500">
            <span className="truncate min-w-0">
              <span className={hasUnread ? 'font-semibold text-gray-700' : 'font-semibold'}>{senderName}: </span>
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