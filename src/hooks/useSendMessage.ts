import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from '../lib/api.ts';

export function useSendMessage(chatId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => sendMessage(chatId, content),
    onSuccess: () => {
      // инвалидируем кэш, чтобы список сообщений обновился
      queryClient.invalidateQueries({ queryKey: ['messages', chatId]})
    },
  })
}