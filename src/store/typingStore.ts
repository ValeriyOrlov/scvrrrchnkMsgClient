import { create } from 'zustand'

interface TypingState {
  typing: Record<number, number[]> // chatId -> массив userId
  setTyping: (chatId: number, userId: number, isTyping: boolean) => void
}

export const useTypingStore = create<TypingState>((set) => ({
  typing: {},
  setTyping: (chatId, userId, isTyping) => {
    set((state) => {
      const users = state.typing[chatId] || []
      if (isTyping) {
        if (!users.includes(userId)) {
          return { typing: { ...state.typing, [chatId]: [...users, userId] } }
        }
      } else {
        return { typing: { ...state.typing, [chatId]: users.filter(id => id !== userId) } }
      }
      return state
    })
  },
}))