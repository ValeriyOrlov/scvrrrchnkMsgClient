import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendMessage, sendEncryptedMessage } from '../lib/api'
import type { Message } from '../types'

export function useSendMessage(chatId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { content: string; encrypted?: any }) => {
      if (data.encrypted && data.encrypted.encrypted_content) {
        return sendEncryptedMessage(
          chatId,
          '',
          data.encrypted.encrypted_content,
          data.encrypted.encrypted_key_sender || '',
          data.encrypted.encrypted_key_recipient || '',
          data.encrypted.iv,
          data.encrypted.auth_tag
        )
      }
      return sendMessage(chatId, data.content)
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['messages', chatId], (old: Message[] = []) => [...old, newMessage])
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}