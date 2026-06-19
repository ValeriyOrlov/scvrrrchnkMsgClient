import authApi from "./axios";
import messengerApi from "./messengerApi";
import type { Chat, Message } from "../types/index.ts"

export const loginApi = (email: string, password: string) => authApi.post('/login', { email, password }).
  then(res => res.data)

export const registerApi = (email: string, username: string, password: string) => authApi.post('/register', { email, username, password }).
  then(res => res.data)

export const refreshApi = (refreshToken: string) => authApi.post('/refresh', { refresh_token: refreshToken }).
  then(res => res.data)

export const getChats = () => messengerApi.get<Chat[]>('/chats').then(res => res.data)

export const getChat = (chatId: number) =>
  messengerApi.get<Chat>(`/chats/${chatId}`).then(res => res.data)

export const getChatById = (chatId: number) => messengerApi.get<Chat>(`/chats/${chatId}`).then(res => res.data)

export const getMessages = (chatId: number, limit = 50, offset = 0) =>
  messengerApi.get<Message[]>(`/chats/${chatId}/messages`, {
    params: { limit, offset },
  }).then(res => res.data)

export const sendMessage = (chatId: number, content: string) =>
  messengerApi.post<Message>(`/chats/${chatId}/messages`, { content }).then(res => res.data)

export const createChat = (type: string, name: string, memberIds: number[]) =>
  messengerApi.post('/chats', { type, chat_name: name, member_ids: memberIds}).then(res => res.data)

export const searchUsers = (q: string) =>
  messengerApi.get('/users/search', { params: { q } }).then(res => res.data)

export const addMembersToChat = (chatId: number, memberIds: number[]) =>
  messengerApi.post(`/chats/${chatId}/members`, { member_ids: memberIds })

export const leaveChat = (chatId: number) =>
  messengerApi.delete(`/chats/${chatId}/members`).then(res => res.data)

export const updateMessage = (chatId: number, messageId: number, content: string) =>
  messengerApi.patch(`/chats/${chatId}/messages/${messageId}`, { content }).then(res => res.data)

export const deleteMessage = (chatId: number, messageId: number) =>
  messengerApi.delete(`/chats/${chatId}/messages/${messageId}`)

export const getOnlineUsers = () =>
  messengerApi.get('/online').then(res => res.data.online)

export const getMessageById = (id: number) =>
  messengerApi.get<Message>(`/messages/${id}`).then(res => res.data)

export const markAsRead = (chatId: number, lastReadMessageId: number) =>
  messengerApi.put(`/chats/${chatId}/read`, { last_read_message_id: lastReadMessageId })