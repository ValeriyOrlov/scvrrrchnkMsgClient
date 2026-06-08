import { createContext, useContext } from 'react'

interface WebSocketContextType {
  sendMessage: (data: any) => void
}

export const WebSocketContext = createContext<WebSocketContextType>({
  sendMessage: () => {},
})

export const useWS = () => useContext(WebSocketContext)