import axios from "axios"

const messengerApi = axios.create({
  baseURL: import.meta.env.VITE_MESSANGER_API_URL || 'http://localhost:8081/api',
})

messengerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default messengerApi