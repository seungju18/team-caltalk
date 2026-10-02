import { api } from './client.ts'

export type TodoStatus = 'not_started' | 'in_progress' | 'done' | 'overdue'
export type TodoFilter = 'all' | TodoStatus

export const FILTER_LABELS: Record<TodoFilter, string> = {
  all: '전체',
  not_started: '시작 전',
  in_progress: '진행 중',
  done: '완료',
  overdue: '지연',
}

export type TodoBase = {
  id: number
  categoryId: number
  categoryName: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}
export type Todo = TodoBase & { status: TodoStatus }
export type TodoCreate = { title: string; description: string | null; categoryId: number | null; startDate: string; endDate: string }
export type TodoUpdate = Partial<TodoCreate & { isCompleted: boolean }>

export function listTodos(q: { filter: TodoFilter; categoryId: number | null; today: string }): Promise<Todo[]> {
  const params = q.categoryId === null ? { filter: q.filter, today: q.today } : q
  return api.get<Todo[]>('/todos', { params }).then((r) => r.data)
}

export function listCalendarTodos(month: string, today: string): Promise<Todo[]> {
  return api.get<Todo[]>('/todos/calendar', { params: { month, today } }).then((r) => r.data)
}

export function createTodo(body: TodoCreate): Promise<TodoBase> {
  return api.post<TodoBase>('/todos', body).then((r) => r.data)
}

export function updateTodo(id: number, body: TodoUpdate): Promise<TodoBase> {
  return api.patch<TodoBase>(`/todos/${id}`, body).then((r) => r.data)
}

export function deleteTodo(id: number): Promise<void> {
  return api.delete<void>(`/todos/${id}`).then((r) => r.data)
}
