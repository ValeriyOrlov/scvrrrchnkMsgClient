import axios from "axios"
import useAuthStore from '../store/authStore'

const messengerApi = axios.create({
  baseURL: import.meta.env.VITE_MESSENGER_API_URL || 'http://localhost:8081/api',
})

messengerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

messengerApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default messengerApi