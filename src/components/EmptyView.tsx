import { useNavigate } from "react-router-dom";

export function EmptyView() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-6xl mb-4">💬</div>
      <p className="text-gray-600 text-center mb-4">У вас пока нет чатов</p>
      <button
        onClick={() => navigate('/search')} // позже можно сделать экран создания чата
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700"
      >
        Создать чат
      </button>
    </div>  
  )
}