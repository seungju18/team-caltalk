import type { CalendarCell as Cell } from '../lib/date'
import type { Todo } from '../api/todos'
import { useLang } from '../hooks/useLang'

const BOX = 'min-h-16 p-1 md:min-h-28 md:p-2 border-r border-b border-line min-w-0'

// md 이상: 제목 3건 + "+N", md 미만: "N건"만 (NFR-13)
export default function CalendarCell({ cell, onOpen }: { cell: Cell<Todo>; onOpen(todo: Todo): void }) {
  const { t } = useLang()
  if (!cell) return <div className={BOX} />
  return (
    <div className={`${BOX} ${cell.isToday ? 'bg-today outline outline-1 outline-today-line -outline-offset-1' : ''}`}>
      <p className={`text-sm tabular-nums ${cell.isSunday ? 'text-danger' : ''}`}>{cell.day}</p>
      {cell.todos.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onOpen(t)}
          className={`hidden md:block w-full text-left truncate text-xs focus-visible:outline-2 focus-visible:outline-primary ${t.isCompleted ? 'text-fg-muted line-through' : 'text-primary-fg'}`}
        >
          {t.title}
        </button>
      ))}
      {cell.more > 0 && <p className="hidden md:block text-xs text-fg-muted">+{cell.more}</p>}
      {cell.count > 0 && <p className="md:hidden text-xs text-primary-fg">{t('calendar.count', { n: cell.count })}</p>}
    </div>
  )
}
