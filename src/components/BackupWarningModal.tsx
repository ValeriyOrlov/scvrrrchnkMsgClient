import { useNavigate } from 'react-router-dom'

interface Props {
  onClose: () => void
}

export default function BackupWarningModal({ onClose }: Props) {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-2">🔐 Ваши сообщения зашифрованы!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Для обеспечения безопасности используется сквозное шифрование. 
          Ваш приватный ключ хранится только на этом устройстве. 
          <br /><br />
          <strong>При смене устройства или браузера вы потеряете доступ к истории переписки.</strong> 
          Чтобы этого избежать, создайте резервную копию ключа в настройках.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose()
              navigate('/backup')
            }}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Перейти к настройке
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Позже
          </button>
        </div>
      </div>
    </div>
  )
}