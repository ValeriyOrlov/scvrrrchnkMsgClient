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

  // Модальное окно показывается, если:
  // 1. Бэкап ещё не создан (backup_created === false)
  // 2. Ещё не показывалось сегодня (или показывалось > 24 часов назад)
  const shouldShowWarning = !backupCreated && (
    !localStorage.getItem('backup_warning_last_shown') ||
    (Date.now() - parseInt(localStorage.getItem('backup_warning_last_shown') || '0') > 24 * 60 * 60 * 1000)
  )

  // Функция, которая вызывается при закрытии окна (кнопка «Позже»)
  const dismissBackupWarning = useCallback(() => {
    localStorage.setItem('backup_warning_last_shown', Date.now().toString())
    setShowBackupWarning(false)
  }, [])

  // При первом рендере или изменении флага бэкапа
  useEffect(() => {
    if (shouldShowWarning) {
      setShowBackupWarning(true)
      // Если ещё не показывали ни разу, тоже запоминаем время, чтобы окно не висело вечно
      if (!localStorage.getItem('backup_warning_last_shown')) {
        localStorage.setItem('backup_warning_last_shown', Date.now().toString())
      }
    }
  }, [shouldShowWarning])

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginApi(email, password)
    const payload: any = jwtDecode(data.access_token)
    const user = { id: payload.user_id, username: payload.username }
    setAuth(data.access_token, data.refresh_token, user)

    // Проверяем, есть ли уже приватный ключ
    const existingPrivateKey = getPrivateKey(user.id)
    if (!existingPrivateKey) {
      try {
        const keypair = await generateRSAKeyPair()
        savePrivateKey(user.id, keypair.privateKey)
        await updatePublicKey(keypair.publicKey)
        if (!backupCreated && !localStorage.getItem('backup_warning_shown')) {
          setShowBackupWarning(true)
        }
        console.log('RSA keys generated and public key sent to server')
        // Проверяем флаг первого входа
        if (!localStorage.getItem('backup_warning_shown')) {
          setShowBackupWarning(true)
        }
      } catch (err) {
        console.error('Failed to generate keys', err)
      }
    }
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
    showBackupWarning,
    dismissBackupWarning,
    backupCreated,
    markBackupCreated,
  }
}