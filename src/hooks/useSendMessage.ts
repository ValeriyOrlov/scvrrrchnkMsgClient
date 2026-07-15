import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendMessage, sendEncryptedMessage } from '../lib/api'

export function useSendMessage(chatId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { content: string; encrypted?: any }) => {
      if (data.encrypted && data.encrypted.encrypted_content) {
        return sendEncryptedMessage(
          chatId,
          '', // сервер не должен знать открытый текст
          data.encrypted.encrypted_content,
          data.encrypted.encrypted_key_sender || '',
          data.encrypted.encrypted_key_recipient || '',
          data.encrypted.iv,
          data.encrypted.auth_tag
        )
      }
      return sendMessage(chatId, data.content)
    },
    onSuccess: (serverMessage, variables) => {
      // Обновляем сообщение в кэше, сохраняя открытый текст для отправителя
      queryClient.setQueryData(['messages', chatId], (old: any[] = []) => {
        const updated = old.map(msg =>
          msg.id === serverMessage.id
            ? { ...serverMessage, content: variables.content } // восстанавливаем content
            : msg
        )
        // Если сообщения с таким id не было (временное), добавляем
        if (!updated.some(m => m.id === serverMessage.id)) {
          updated.push({ ...serverMessage, content: variables.content })
        }
        return updated
      })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}