import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTodo, deleteTodo, updateTodo, type Todo, type TodoUpdate } from '../api/todos'
import { parseApiError } from '../api/client'

// 성공 시 ['todos'] 접두 쿼리 전체 무효화 → 목록·캘린더 동시 갱신
export function useTodoMutations() {
  const qc = useQueryClient()
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['todos'] })
  const create = useMutation({ mutationFn: createTodo, onSuccess })
  const update = useMutation({
    mutationFn: (v: { id: number; body: TodoUpdate }) => updateTodo(v.id, v.body),
    onSuccess,
  })
  const remove = useMutation({ mutationFn: deleteTodo, onSuccess })
  // FE-10: 낙관적 업데이트 없음. 체크박스는 서버 값으로 그려 실패 시 이전 값 그대로
  const toggle = useMutation({
    mutationFn: (todo: Todo) => updateTodo(todo.id, { isCompleted: !todo.isCompleted }),
    onSuccess,
  })
  return {
    createTodo: create.mutateAsync,
    isCreating: create.isPending,
    updateTodo: (id: number, body: TodoUpdate) => update.mutateAsync({ id, body }),
    isUpdating: update.isPending,
    deleteTodo: remove.mutateAsync,
    isDeleting: remove.isPending,
    toggleComplete: (todo: Todo) => toggle.mutate(todo),
    isToggling: toggle.isPending,
    toggleError: toggle.error ? parseApiError(toggle.error).message : null,
  }
}
