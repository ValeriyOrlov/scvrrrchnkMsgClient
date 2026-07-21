import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from "react-router-dom";

export function EmptyView() {
  const { user: currentUser, logout, backupCreated } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  return (
    <>
    <header className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
          >
            <h2 className="text-lg font-semibold">{currentUser?.username}</h2>
            {!backupCreated && (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-yellow-400 text-white text-xs rounded-full" title="Создайте резервную копию ключа">
                !
              </span>
            )}
            <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-xl py-2 z-20">
              <button
                onClick={() => { navigate('/backup'); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                🔐 Резервное копирование
              </button>
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
              >
                🚪 Выйти
              </button>
            </div>
          )}
        </div>
      </header>
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-6xl mb-4">💬</div>
      <p className="text-gray-600 text-center mb-4">У вас пока нет чатов</p>
      <button
        onClick={() => navigate('/search')}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700"
      >
        Чирикнуть кому-нибудь...
      </button>
    </div>  
    </>
  )
}