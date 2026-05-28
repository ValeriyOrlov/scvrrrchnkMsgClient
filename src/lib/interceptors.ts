import axios from 'axios'
import useAuthStore from '../store/authStore'
import { jwtDecode } from 'jwt-decode'
import type { User } from '../types'

export function setupAuthInterceptor(api: ReturnType<typeof axios.create>) {
  const refreshApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  })
  // На refreshApi НЕ вешаем перехватчик, чтобы избежать рекурсии

  
  let isRefreshing = false
  let failedQueue: any[] = []

  const processQueue = (error: any, token: string | null) => {
    failedQueue.forEach(prom => {
      if (error) prom.reject(error)
      else prom.resolve(token!)
    })
  failedQueue = []
  }

  api.interceptors.response.use(
    response => response,
    async (error) => {
      const originalRequest = error.config
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }
      // если это сам запрос на /refresh вернул 401 - чистим всё и редиректим

      if (originalRequest.url === '/refresh') {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // всегда отправляем refresh-запрос на auth-сервер
        const { data } = await refreshApi.post('/refresh', { refresh_token: refreshToken })
        const newAccess = data.access_token
        const newRefresh = data.refresh_token
        // декодируем пользователя из токена
        const payload: any = jwtDecode(newAccess)
        const user: User = { id: payload.user_id, username: payload.username }
        useAuthStore.getState().setAuth(newAccess, newRefresh, user)
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
  )
}