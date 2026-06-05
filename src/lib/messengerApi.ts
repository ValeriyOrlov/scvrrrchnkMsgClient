import axios from "axios"
import { setupAuthInterceptor } from "./interceptors.ts"

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

setupAuthInterceptor(messengerApi)

export default messengerApi