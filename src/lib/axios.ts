import axios from "axios";
import { setupAuthInterceptor } from "./interceptors";

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

setupAuthInterceptor(authApi)


export default authApi