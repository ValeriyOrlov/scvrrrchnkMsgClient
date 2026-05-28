import { useCallback, useRef, useEffect } from "react";
import useAuthStore, { isTokenExpired } from "../store/authStore";
import { loginApi, registerApi } from "../lib/api";
import authApi from "../lib/axios.ts"
import { jwtDecode } from "jwt-decode";

export function useAuth() {
  const { accessToken, user, setAuth, clearAuth } = useAuthStore()
  const intervalRef = useRef<number | undefined>(undefined)

  const login = useCallback(async (email: string, password: string ) => {
    const data = await loginApi(email, password)
    const payload: any = jwtDecode(data.access_token)
    const user = {
      id: payload.user_id,
      username: payload.username,
    }
    setAuth(data.access_token, data.refresh_token, user)
  }, [setAuth])

  const register = useCallback(async (email: string, username: string, password: string) => {
    await registerApi(email, username, password)
    await login(email, password)
  }, [login])

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  // Keep-alive: каждые 10 минут молча обновляем токен, если до истечения меньше 5 минут
  useEffect(() => {
    if (!accessToken) return

    const refreshIfNeeded = async () => {
      // Проверяем, не истекает ли токен в ближайшие 5 минут
      if (isTokenExpired(accessToken)) {
        // Уже истёк – пробуем обновить
        try {
          const refreshToken = localStorage.getItem('refreshToken')
          if (!refreshToken) {
            logout()
            return
          }
          const { data } = await authApi.post('/refresh', { refresh_token: refreshToken })
          const payload: any = jwtDecode(data.access_token)
    const user = {
      id: payload.user_id,
      username: payload.username,
    }
    setAuth(data.access_token, data.refresh_token, user)
        } catch {
          logout()
        }
      }
    }

    refreshIfNeeded() // сразу при монтировании
    intervalRef.current = window.setInterval(refreshIfNeeded, 10 * 60 * 1000) // каждые 10 минут
    return () => clearInterval(intervalRef.current)
  }, [accessToken, logout]) // зависит от accessToken, чтобы перезапускаться при смене токена
  return {
    accessToken,
    user,
    isAuthenticated: !!accessToken && !isTokenExpired(accessToken),
    login,
    register,
    logout,
  }
}