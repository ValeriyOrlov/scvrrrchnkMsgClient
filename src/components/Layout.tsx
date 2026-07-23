import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import { WebSocketContext } from '../contexts/WebSocketContext'
import { useAuth } from '../hooks/useAuth'
import BackupWarningModal from '../components/BackupWarningModal'

export default function Layout() {
  const { sendMessage: rawSend } = useWebSocket()
  const { showBackupWarning, dismissBackupWarning } = useAuth()
  const sendMessage = useMemo(() => rawSend, [rawSend])

  return (
    <WebSocketContext.Provider value={{ sendMessage }}>
      <div className="max-w-lg mx-auto h-dvh bg-white overflow-hidden">
        <Outlet />
        {showBackupWarning && <BackupWarningModal onClose={dismissBackupWarning} />}
      </div>
    </WebSocketContext.Provider>
  )
}