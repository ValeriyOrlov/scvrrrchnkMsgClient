import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import signupBird from "../assets/images/signup_bird.jpg"
import crashBird from "../assets/images/crash_bird.jpg"

function getHumanReadableError(error: any): string {
  if (!error?.response?.data?.error) return 'Ошибка регистрации'
  
  const msg = error.response.data.error.toLowerCase()
  
  if (msg.includes('invalid email')) return 'Некорректный email адрес'
  if (msg.includes('min 3 characters')) return 'Имя пользователя должно быть не короче 3 символов'
  if (msg.includes('min 8 characters')) return 'Пароль должен быть не короче 8 символов'
  if (msg.includes('user already exists') || msg.includes('duplicate')) return 'Пользователь с таким email или именем уже существует'
  if (msg.includes('invalid input')) return 'Пожалуйста, проверьте правильность введённых данных'
  if (msg.includes('network')) return 'Проблемы с сетью. Проверьте подключение'
  
  return 'Ошибка регистрации'
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chats', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(email, username, password)
    } catch (err: any) {
      setError(getHumanReadableError(err))
    } finally {
      setLoading(false)
      setTimeout(() => setError(''), 2000)
    }
  }
  return (
    <div className="py-8">
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Регистрация</h2>
        <img
          src={error ? crashBird : signupBird}
          alt="Птичка"
          className="w-64 h-64 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold mb-6 text-center">.scvorrrechnik!</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Имя пользователя
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              placeholder="Ваше имя"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Не менее 8 символов"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Войти
          </Link>
        </p>
      </div>
      <div className="mt-8 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm shadow-sm">
          <span className="text-xs text-gray-500">строил</span>
          <span className="text-sm font-medium text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            @ValerrriyOrlov
          </span>
          <span className="text-xs text-gray-500">разукрашивала</span>
          <span className="text-sm font-medium text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            @Semy08
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">2026</span>
        </div>
      </div>
    </div>
  )
}