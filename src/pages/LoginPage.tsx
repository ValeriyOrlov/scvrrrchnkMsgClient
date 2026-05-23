import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import flyingBird from "../assets/images/flying_bird.jpg"
import crashBird from "../assets/images/crash_bird.jpg"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated } = useAuth()
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
      await login(email, password)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Ошибка входа')
    } finally {
      setLoading(false)
      setTimeout(() => setError(''), 2000)
    }
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Вход</h1>
      <img
        src={error ? crashBird : flyingBird}
        alt="Птичка"
        className="w-64 h-64 mx-auto mb-4"
      />
      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="••••••••"
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
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-blue-500 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}