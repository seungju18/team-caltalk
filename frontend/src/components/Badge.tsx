import type { TodoStatus } from '../api/todos'
import { useLang } from '../hooks/useLang'

const COLORS: Record<TodoStatus, string> = {
  not_started: 'border border-line-strong text-fg-muted',
  in_progress: 'bg-primary/15 text-primary-fg',
  done: 'bg-success/15 text-success',
  overdue: 'bg-danger/15 text-danger',
}

export default function Badge({ status }: { status: TodoStatus }) {
  const { t } = useLang()
  return (
    <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium ${COLORS[status]}`}>
      {t(`status.${status}`)}
    </span>
  )
}
