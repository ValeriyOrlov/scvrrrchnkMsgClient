import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateMessage, updateEncryptedMessage } from '../lib/api'

export function useUpdateMessage(chatId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { messageId: number; content: string; encrypted?: any }) => {
      if (variables.encrypted) {
        return updateEncryptedMessage(chatId, variables.messageId, variables.content, variables.encrypted)
      }
      return updateMessage(chatId, variables.messageId, variables.content)
    },
    onSuccess: (updatedMessage, variables) => {
      // Обновляем все кэши сообщений этого чата
      queryClient.setQueriesData(
        { queryKey: ['messages', chatId], exact: false },
        (old: any[] = []) =>
          old?.map(msg =>
            msg.id === updatedMessage.id
              ? {
                  ...updatedMessage,           // копируем все поля из ответа сервера (updated_at и т.д.)
                  content: variables.content,  // подставляем новый открытый текст
                }
              : msg
          )
      )
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
    onError: (error, variables) => {
      console.error('UpdateMessage failed', error, variables)
    },
  })
}