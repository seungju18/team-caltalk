import { ValidationError } from '../errors.ts'

export const TITLE_MAX = 100 // 도메인 3.3
export const DESCRIPTION_MAX = 1000 // 도메인 3.3
export const TODO_FILTERS = ['all', 'not_started', 'in_progress', 'done', 'overdue'] as const // FR-10
export type TodoFilter = (typeof TODO_FILTERS)[number]

// BR-08: 서비스가 병합 후 검사에도 같은 사유를 쓴다
export const END_BEFORE_START = { field: 'endDate', reason: '종료일자는 시작일자보다 빠를 수 없습니다' }

export type TodoCreateInput = {
  title: string
  description: string | null
  categoryId: number | null
  startDate: string
  endDate: string
}
export type TodoUpdateInput = Partial<TodoCreateInput & { isCompleted: boolean }>

type FieldError = { field: string; reason: string }
type Body = Record<string, unknown>

function asBody(body: unknown): Body {
  return typeof body === 'object' && body !== null ? (body as Body) : {}
}

// 'YYYY-MM-DD' 형식이면서 실제 존재하는 날짜
function isDate(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || v < '0001') return false
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v)
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v > 0
}

function checkTitle(v: unknown, errors: FieldError[]): string {
  const title = typeof v === 'string' ? v.trim() : ''
  const length = [...title].length
  if (length < 1 || length > TITLE_MAX) errors.push({ field: 'title', reason: `제목은 1~${TITLE_MAX}자여야 합니다` })
  return title
}

// 빈 문자열·null은 NULL로 저장한다
function checkDescription(v: unknown, errors: FieldError[]): string | null {
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string' || [...v].length > DESCRIPTION_MAX) {
    errors.push({ field: 'description', reason: `설명은 최대 ${DESCRIPTION_MAX}자입니다` })
    return null
  }
  return v
}

// 없음·null은 '기본' 카테고리 (BR-06). 소유 확인은 서비스 (BR-13)
function checkCategoryId(v: unknown, errors: FieldError[]): number | null {
  if (v === undefined || v === null) return null
  if (!isPositiveInt(v)) {
    errors.push({ field: 'categoryId', reason: '카테고리가 올바르지 않습니다' })
    return null
  }
  return v
}

function checkDate(field: string, v: unknown, errors: FieldError[]): string {
  if (!isDate(v)) {
    errors.push({ field, reason: '날짜 형식(YYYY-MM-DD)이 올바르지 않습니다' })
    return ''
  }
  return v
}

export function validateTodoCreate(body: unknown): TodoCreateInput {
  const b = asBody(body)
  const errors: FieldError[] = []
  const input: TodoCreateInput = {
    title: checkTitle(b.title, errors),
    description: checkDescription(b.description, errors),
    categoryId: checkCategoryId(b.categoryId, errors),
    startDate: checkDate('startDate', b.startDate, errors),
    endDate: checkDate('endDate', b.endDate, errors),
  }
  // BR-08
  if (input.startDate && input.endDate && input.endDate < input.startDate) errors.push(END_BEFORE_START)
  if (errors.length > 0) throw new ValidationError(errors)
  return input
}

// 보낸 필드만 담는다. 날짜 선후 검사는 기존 값과 병합한 뒤 서비스에서 한다 (AC-06-3)
export function validateTodoUpdate(body: unknown): TodoUpdateInput {
  const b = asBody(body)
  const errors: FieldError[] = []
  const input: TodoUpdateInput = {}
  if ('title' in b) input.title = checkTitle(b.title, errors)
  if ('description' in b) input.description = checkDescription(b.description, errors)
  if ('categoryId' in b) input.categoryId = checkCategoryId(b.categoryId, errors)
  if ('startDate' in b) input.startDate = checkDate('startDate', b.startDate, errors)
  if ('endDate' in b) input.endDate = checkDate('endDate', b.endDate, errors)
  if ('isCompleted' in b) {
    if (typeof b.isCompleted === 'boolean') input.isCompleted = b.isCompleted
    else errors.push({ field: 'isCompleted', reason: '완료 여부는 true 또는 false여야 합니다' })
  }
  if (errors.length === 0 && Object.keys(input).length === 0) {
    errors.push({ field: 'body', reason: '수정할 항목이 없습니다' })
  }
  if (errors.length > 0) throw new ValidationError(errors)
  return input
}

export function validateTodoListQuery(query: Body): { filter: TodoFilter; categoryId: number | null; today: string } {
  const errors: FieldError[] = []
  const today = checkDate('today', query.today, errors) // OI-05: 형식만 검증

  const filter = (query.filter ?? 'all') as TodoFilter
  if (!TODO_FILTERS.includes(filter)) errors.push({ field: 'filter', reason: '허용되지 않는 필터입니다' })

  let categoryId: number | null = null
  if (query.categoryId !== undefined) {
    const raw = query.categoryId
    categoryId = typeof raw === 'string' && /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN
    if (!Number.isSafeInteger(categoryId)) errors.push({ field: 'categoryId', reason: '카테고리가 올바르지 않습니다' })
    // FR-10: 필터는 단일 선택 (가정)
    else if (filter !== 'all') errors.push({ field: 'filter', reason: '카테고리 필터와 상태 필터는 함께 쓸 수 없습니다' })
  }

  if (errors.length > 0) throw new ValidationError(errors)
  return { filter, categoryId, today }
}

export function validateCalendarQuery(query: Body): { month: string; today: string } {
  const errors: FieldError[] = []
  const today = checkDate('today', query.today, errors) // OI-05: 형식만 검증
  const month = query.month
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month < '0001') {
    errors.push({ field: 'month', reason: '월 형식(YYYY-MM)이 올바르지 않습니다' })
  }
  if (errors.length > 0) throw new ValidationError(errors)
  return { month: month as string, today }
}
