export interface User {
  id: number
  username: string
}

export interface ChatMember {
  id: number
  user_id: number
  chat_id: number
  role: 'admin' | 'member'
  joined_at: string
  user: User
}

export interface Chat {
  id: number
  type: 'private' | 'group'
  chat_name: string
  members: ChatMember[]
}

export interface Message {
  id: number
  chat_id: number
  sender_id: number
  content: string
  created_at: string
  sender: User
}