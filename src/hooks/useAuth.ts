import { useCallback } from "react";
import useAuthStore, { isTokenExpired } from "../store/authStore";
import { loginApi, registerApi } from "../lib/api";
import { jwtDecode } from "jwt-decode";

export function useAuth() {
  const { accessToken, user, setAuth, clearAuth } = useAuthStore()

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

  return {
    accessToken,
    user,
    isAuthenticated: !!accessToken && !isTokenExpired(accessToken),
    login,
    register,
    logout,
  }
}