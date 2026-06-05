import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMessage } from "../lib/api.ts";

export function useDeleteMessage(chatId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: number) => deleteMessage(chatId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}