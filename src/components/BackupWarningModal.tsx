import { useNavigate } from 'react-router-dom'

interface Props {
  onClose: () => void
}

export default function BackupWarningModal({ onClose }: Props) {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="text-5xl">🏠</div>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
            <div className="text-2xl">🔒</div>
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">Добро пожаловать в Скворечник!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Ваши сообщения защищены сквозным шифрованием.<br />
          Приватный ключ хранится только на этом устройстве.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-amber-800">
            <strong>⚠️ Важно:</strong> При смене устройства или браузера вы потеряете доступ к истории переписки.
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Чтобы иметь возможность восстановить то, что Вы начирикали, создайте резервную копию ключа.
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