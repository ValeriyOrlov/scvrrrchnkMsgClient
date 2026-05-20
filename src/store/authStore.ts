import { create } from "zustand";

export interface User {
  id: number
  username: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  setAuth: (accessToken: string, refreshToken: string, user: User) => void
  clearAuth: () => void
}

const savedAccess = localStorage.getItem('accessToken')
const savedRefresh = localStorage.getItem('refreshToken')
const savedUser = localStorage.getItem('user')

const useAuthStore = create<AuthState>((set) => ({
  accessToken: savedAccess,
  refreshToken: savedRefresh,
  user: savedUser ? (JSON.parse(savedUser) as User) : null,
  setAuth: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ accessToken, refreshToken, user })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({ accessToken: null, refreshToken: null, user: null})
  },
}))

export default useAuthStore