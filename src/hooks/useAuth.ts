import { useCallback, useRef, useEffect, useState } from "react";
import useAuthStore, { isTokenExpired } from "../store/authStore";
import { loginApi, registerApi } from "../lib/api";
import authApi from "../lib/axios.ts"
import { jwtDecode } from "jwt-decode";
import { updatePublicKey } from "../lib/api";
import { generateRSAKeyPair, savePrivateKey, getPrivateKey } from "../lib/crypto.ts";

export function useAuth() {
  const { accessToken, user, setAuth, clearAuth, backupCreated, setBackupCreated } = useAuthStore()
  const intervalRef = useRef<number | undefined>(undefined)
  const [showBackupWarning, setShowBackupWarning] = useState(false)

  // Метод для установки флага, что бэкап создан (вызывается из BackupPage)
  const markBackupCreated = useCallback(() => {
    localStorage.setItem('backup_created', 'true')
    setBackupCreated(true)
    // сбрасываем напоминания
    localStorage.removeItem('backup_warning_last_shown')
  }, [])

  // Функция, которая вызывается при закрытии окна (кнопка «Позже»)
  const dismissBackupWarning = useCallback(() => {
    localStorage.setItem('backup_warning_last_shown', Date.now().toString())
    setShowBackupWarning(false)
  }, [])

  useEffect(() => {
    if (user && !backupCreated && !localStorage.getItem('backup_warning_shown')) {
      setShowBackupWarning(true)
    }
  }, [user, backupCreated])

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginApi(email, password)
    const payload: any = jwtDecode(data.access_token)
    const user = { id: payload.user_id, username: payload.username }
    setAuth(data.access_token, data.refresh_token, user)

    const existingPrivateKey = getPrivateKey(user.id)
    if (!existingPrivateKey) {
      // Ключа нет – генерируем новую пару
      try {
        const keypair = await generateRSAKeyPair()
        savePrivateKey(user.id, keypair.privateKey)
        await updatePublicKey(keypair.publicKey)
        console.log('RSA keys generated and public key sent to server')
        
        // Сбрасываем флаг бэкапа, потому что ключи новые
        setBackupCreated(false)
        localStorage.removeItem('backup_created')
      } catch (err) {
        console.error('Failed to generate keys', err)
      }
    } else {
      // Ключ уже есть (восстановлен или остался с предыдущей сессии)
      // НЕ генерируем новый и НЕ обновляем публичный ключ на сервере
      console.log('Using existing private key')
    }
  }, [setAuth, setBackupCreated])

  const register = useCallback(async (email: string, username: string, password: string) => {
    await registerApi(email, username, password)
    await login(email, password)
  }, [login])

  // В logout сбрасываем флаг показа, чтобы при следующем входе окно появилось снова
  const logout = useCallback(() => {
    clearAuth()
    localStorage.removeItem('backup_warning_shown') // чтобы при следующем логине окно опять показалось
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
    showBackupWarning,
    dismissBackupWarning,
    backupCreated,
    markBackupCreated,
  }
}