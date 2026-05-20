import authApi from "./axios";

export const loginApi = (email: string, password: string) => authApi.post('/login', { email, password }).
  then(res => res.data)

export const registerApi = (email: string, username: string, password: string) => authApi.post('/register', { email, username, password }).
  then(res => res.data)

export const refreshApi = (refreshToken: string) => authApi.post('/refresh', { refresh_token: refreshToken }).
  then(res => res.data)