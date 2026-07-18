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

  const handleSave = async () => {
    if (!password) return
    const privateKey = getPrivateKey(currentUser!.id)
    if (!privateKey) {
      setMessage('У вас нет приватного ключа для резервирования.')
      return
    }
    const encrypted = encryptWithPassword(privateKey, password)
    try {
      await saveBackup(encrypted)
      useAuthStore.getState().setBackupCreated(true)
      setModalMessage('Резервная копия успешно сохранена!')
      setShowModal(true)
    } catch (e) {
      setMessage('Ошибка сохранения.')
    }
  }

  const handleRestore = async () => {
    if (!password) return
    try {
      const encryptedBackup = await getBackup()
      const decrypted = decryptWithPassword(encryptedBackup, password)
      if (decrypted) {
        localStorage.setItem(`privateKey_${currentUser!.id}`, decrypted)
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
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Резервное копирование ключа</h2>
      <p className="text-sm text-gray-600 mb-2">
        Пароль используется для шифрования вашего приватного ключа перед сохранением на сервере.
        Не забывайте его, иначе восстановить доступ к истории будет невозможно.
      </p>
      <input
        type="password"
        placeholder="Введите пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-4"
      />
      <div className="flex gap-2">
        <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Сохранить копию</button>
        <button onClick={handleRestore} className="bg-green-500 text-white px-4 py-2 rounded-lg">Восстановить ключ</button>
      </div>
      {message && <p className="mt-4 text-sm">{message}</p>}

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