import axios from "axios";
import useAuthStore from "../store/authStore";
import { jwtDecode } from 'jwt-decode'
import type { User } from '../store/authStore'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Если это запрос на логин или регистрацию — не пытаемся обновлять токен
      if (originalRequest.url === '/login' || originalRequest.url === '/register') {
        return Promise.reject(error)
}
      // если это сам запрос на обновление токена вернул 401 - конец
      if (originalRequest.url === '/refresh') {
        useAuthStore.getState().clearAuth();
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      //если обновление уже идёт - ставим запрос в очередь
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return authApi(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.clear()
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await authApi.post('/refresh', { refresh_token: refreshToken})
        const newAccess = data.access_token
        const newRefresh = data.refresh_token
        const payload: any = jwtDecode(newAccess)
        const user: User = {
          id: payload.user_id,
          username: payload.username,
        }
        useAuthStore.getState().setAuth(newAccess, newRefresh, user)

        localStorage.setItem('accessToken', newAccess)
        localStorage.setItem('refreshToken', newRefresh)

        authApi.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return authApi(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default authApi