import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

export interface User {
  id: number
  username: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  backupCreated: boolean
  setAuth: (accessToken: string, refreshToken: string, user: User) => void
  clearAuth: () => void
  setBackupCreated: (value: boolean) => void
}

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = jwtDecode<{ exp: number }>(token);
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}

const savedAccess = localStorage.getItem('accessToken')
const savedRefresh = localStorage.getItem('refreshToken')

const validAccess = !isTokenExpired(savedAccess) ? savedAccess : null;
const validRefresh = !isTokenExpired(savedRefresh) ? savedRefresh : null;

const savedUser = localStorage.getItem('user')

const useAuthStore = create<AuthState>((set) => ({
  accessToken: validAccess,
  refreshToken: validRefresh,
  user: savedUser ? (JSON.parse(savedUser) as User) : null,
  backupCreated: localStorage.getItem('backup_created') === 'true',
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
  setBackupCreated: (value) => {
    localStorage.setItem('backup_created', value ? 'true' : 'false')
    set({ backupCreated: value })
  },
}))

export default useAuthStore