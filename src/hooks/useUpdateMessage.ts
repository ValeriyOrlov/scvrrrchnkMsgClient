import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMessage } from "../lib/api.ts";

export function useUpdateMessage(chatId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: number; content: string}) => 
      updateMessage(chatId, messageId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId]})
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}