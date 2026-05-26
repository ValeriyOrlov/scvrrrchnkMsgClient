export function ChatsSkeleton() {
  const skeletonItems = Array.from({ length: 5 }, (_, i) => i)

  return (
    <div className="flex flex-col h-full">
      {/* Заглушка хедера */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="w-12 h-5 bg-gray-200 rounded animate-pulse" />
      </div>
      {/* Список скелетон-элементов */}
      <ul className="flex-1 overflow-y-auto">
        {skeletonItems.map((i) => (
          <li key={i} className="flex items-center gap-3 p-4 border-b border-gray-100">
            {/* Аватар */}
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              {/* Имя чата */}
              <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
              {/* Последнее сообщение */}
              <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}