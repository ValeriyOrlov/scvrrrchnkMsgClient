interface ErrorViewProps {
  message?: string
  onRetry?: () => void
}

export function ErrorView({ message = 'Что-то пошло не так', onRetry}: ErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-6xl mb-4">😞</div>
      <p className="text-gray-600 text-center mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700"
        >
          Попробовать снова
        </button>
      )}
    </div>   
  )
}