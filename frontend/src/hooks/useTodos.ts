import { useQuery } from '@tanstack/react-query'
import { listTodos } from '../api/todos'
import { parseApiError } from '../api/client'
import { useUiStore } from '../stores/uiStore'
import { today } from '../lib/date'
import { useLang } from './useLang'

// 목록 탭: 필터·카테고리·로컬 오늘로 조회 (FR-10). 필터는 store 에 있어 탭을 오가도 유지된다
export function useTodos() {
  const filter = useUiStore((s) => s.filter)
  const categoryId = useUiStore((s) => s.categoryId)
  const setFilter = useUiStore((s) => s.setFilter)
  const setCategoryFilter = useUiStore((s) => s.setCategoryFilter)
  const { t } = useLang()
  const day = today()
  const q = useQuery({
    queryKey: ['todos', 'list', filter, categoryId, day],
    queryFn: () => listTodos({ filter, categoryId, today: day }),
  })
  return {
    todos: q.data ?? [],
    isTodosLoading: q.isPending,
    todosError: q.error ? parseApiError(q.error).message : null,
    filter,
    categoryId,
    setFilter,
    setCategoryFilter,
    emptyText: filter === 'all' && categoryId === null ? t('main.emptyAll') : t('main.emptyFiltered'),
  }
}
