import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPrivateKey, encryptWithPassword, decryptWithPassword } from '../lib/crypto'
import { saveBackup, getBackup } from '../lib/api'
import useAuthStore from '../store/authStore'

export default function BackupPage() {
  const currentUser = useAuthStore(state => state.user)
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [errorField, setErrorField] = useState<'password' | null>(null)

  const handleSave = async () => {
    if (!password) {
      setErrorField('password')
      setMessage('Пожалуйста, введите пароль')
      return
    }
    setErrorField(null)
    setMessage('')

    const privateKey = getPrivateKey(currentUser!.id)
    if (!privateKey) {
      setMessage('У вас нет приватного ключа для резервирования.')
      return
    }
    const encrypted = encryptWithPassword(privateKey, password)
    try {
      await saveBackup(encrypted)
      useAuthStore.getState().setBackupCreated(true)
      setModalMessage('Резервная копия успешно сохранена на сервере!')
      setShowModal(true)
    } catch (e) {
      setMessage('Ошибка сохранения.')
    }
  }

  const handleRestore = async () => {
    if (!password) {
      setErrorField('password')
      setMessage('Пожалуйста, введите пароль')
      return
    }
    setErrorField(null)
    setMessage('')

    try {
      const encryptedBackup = await getBackup()
      const decrypted = decryptWithPassword(encryptedBackup, password)
      if (decrypted) {
        localStorage.setItem(`privateKey_${currentUser!.id}`, decrypted)
        useAuthStore.getState().setBackupCreated(true)
        setModalMessage('Ключ успешно восстановлен!')
        setShowModal(true)
      } else {
        setMessage('Неверный пароль или резервная копия повреждена.')
      }
    } catch (e) {
      setMessage('Резервная копия не найдена.')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    navigate('/chats', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Хедер со стрелкой назад */}
      <header className="p-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-blue-500">
          ← Назад
        </button>
        <h2 className="text-lg font-semibold">Резервное копирование</h2>
      </header>

      {/* Прокручиваемый контент */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Важная информация</p>
            <p className="text-sm text-yellow-700">
              Ваши личные сообщения защищены сквозным шифрованием. Ключ для расшифровки хранится только
              на этом устройстве. Если вы потеряете доступ к устройству, очистите данные браузера или
              войдёте с другого телефона/компьютера, вы <strong>не сможете прочитать старые сообщения</strong>.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Чтобы этого не случилось, создайте резервную копию ключа, защищённую вашим личным паролем.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-3">
              <strong>📥 Сохранить копию</strong> – зашифрует ваш ключ введённым паролем и отправит на сервер.
              Вы сможете восстановить ключ на любом другом устройстве, зная пароль.
            </p>
            <p className="text-sm text-gray-600">
              <strong>📤 Восстановить ключ</strong> – загрузит сохранённую копию с сервера и расшифрует её.
              После восстановления история переписки снова станет доступной.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800 font-medium mb-1">❗ Запомните пароль</p>
            <p className="text-sm text-red-700">
              При утере пароля восстановить доступ к зашифрованной истории будет невозможно.
              Мы не храним пароль и не можем его восстановить.
            </p>
          </div>

          <div className="mb-4">
            <input
              type="password"
              placeholder="Придумайте и введите пароль"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrorField(null)
                setMessage('')
              }}
              className={`w-full border rounded-lg px-4 py-2.5 ${
                errorField === 'password' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
            />
          </div>

          <div className="flex gap-3 mb-4">
            <button onClick={handleSave} className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors">
              📥 Сохранить копию
            </button>
            <button onClick={handleRestore} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl hover:bg-green-600 transition-colors">
              📤 Восстановить ключ
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${
              errorField ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно с сообщением */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <p className="text-center text-lg font-medium mb-4">{modalMessage}</p>
            <button
              onClick={handleCloseModal}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}