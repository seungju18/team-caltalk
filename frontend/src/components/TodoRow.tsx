import Badge from './Badge'
import type { Todo } from '../api/todos'
import { useLang } from '../hooks/useLang'

type Props = { todo: Todo; onOpen(todo: Todo): void; onToggle(todo: Todo): void; disabled: boolean }

// 모바일·데스크톱 모두 2줄: [체크] 제목 / 카테고리 · 기간, 오른쪽 배지
export default function TodoRow({ todo, onOpen, onToggle, disabled }: Props) {
  const { t } = useLang()
  return (
    <li className="flex items-start md:items-center gap-3 px-4 py-3 border-b border-line hover:bg-surface-hover">
      <input
        type="checkbox"
        aria-label={t('todo.toggle', { title: todo.title })}
        checked={todo.isCompleted}
        disabled={disabled}
        onChange={() => onToggle(todo)}
        className="size-4 mt-0.5 md:mt-0 shrink-0 rounded-sm accent-primary disabled:cursor-not-allowed"
      />
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => onOpen(todo)}
          className={`block max-w-full text-left text-sm break-words focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${todo.isCompleted ? 'text-fg-muted line-through' : 'text-fg'}`}
        >
          {todo.title}
        </button>
        <p className="text-xs text-fg-muted tabular-nums">
          {todo.categoryName} · {todo.startDate} ~ {todo.endDate}
        </p>
      </div>
      <Badge status={todo.status} />
    </li>
  )
}
