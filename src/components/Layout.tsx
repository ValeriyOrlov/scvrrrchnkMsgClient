import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import { WebSocketContext } from '../contexts/WebSocketContext'

export default function Layout() {
  const { sendMessage: rawSend } = useWebSocket()
  const sendMessage = useMemo(() => rawSend, [rawSend])

  return (
    <WebSocketContext.Provider value={{ sendMessage }}>
      <div className="max-w-lg mx-auto min-h-screen bg-gray-50 p-4">
        <Outlet />
      </div>
    </WebSocketContext.Provider>
  )
}