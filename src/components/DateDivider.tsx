interface Props {
  date: Date
}

export default function DateDivider({ date }: Props) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  if (date.toDateString() === today.toDateString()) {
    label = 'Сегодня'
  } else if (date.toDateString() === yesterday.toDateString()) {
    label = 'Вчера'
  }

  return (
    <div className="flex items-center justify-center my-3">
      <div className="bg-gray-200/70 backdrop-blur-sm text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
        {label}
      </div>
    </div>
  )
}