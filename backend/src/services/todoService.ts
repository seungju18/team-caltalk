import { pool, withTransaction } from '../db.ts'
import { NotFoundError, ValidationError } from '../errors.ts'
import { END_BEFORE_START } from '../validators/todoValidator.ts'
import type { TodoCreateInput, TodoFilter, TodoUpdateInput } from '../validators/todoValidator.ts'

type TodoBase = {
  id: number
  categoryId: number
  categoryName: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}
type Todo = TodoBase & { status: 'not_started' | 'in_progress' | 'done' | 'overdue' }

// 응답 컬럼. t = todos, c = categories (categoryName 표시용)
const COLUMNS = `t.id::int AS id, t.category_id::int AS "categoryId", c.name AS "categoryName", t.title, t.description,
  t.start_date AS "startDate", t.end_date AS "endDate", t.is_completed AS "isCompleted",
  t.created_at AS "createdAt", t.updated_at AS "updatedAt"`

// BR-10: 오늘($2) 기준으로 처음 만족하는 조건 하나로 상태를 정한다
const STATUS = `CASE WHEN t.is_completed THEN 'done'
  WHEN $2::date < t.start_date THEN 'not_started'
  WHEN $2::date <= t.end_date THEN 'in_progress'
  ELSE 'overdue' END AS status`

// FR-10: 허용된 필터만 SQL 조건으로 매핑한다 (BR-10과 같은 순서의 조건)
const FILTER_SQL: Record<TodoFilter, string> = {
  all: 'TRUE',
  not_started: 'NOT t.is_completed AND $2::date < t.start_date',
  in_progress: 'NOT t.is_completed AND $2::date BETWEEN t.start_date AND t.end_date',
  done: 't.is_completed',
  overdue: 'NOT t.is_completed AND $2::date > t.end_date',
}

const ORDER = 'ORDER BY t.end_date, t.created_at, t.id'

// BR-06, BR-13: categoryId가 null이면 본인 '기본', 아니면 본인 카테고리만. $1 = userId, $2 = categoryId
const OWN_CATEGORY = `SELECT id FROM categories WHERE user_id = $1 AND (($2::bigint IS NULL AND is_default) OR id = $2)`
const NOT_OWN_CATEGORY = { field: 'categoryId', reason: '본인 카테고리만 지정할 수 있습니다' }

export async function createTodo(userId: number, input: TodoCreateInput): Promise<TodoBase> {
  const { rows } = await pool.query<TodoBase>(
    `WITH t AS (
       INSERT INTO todos (user_id, category_id, title, description, start_date, end_date)
       SELECT $1, id, $3, $4, $5, $6 FROM (${OWN_CATEGORY}) own
       RETURNING *
     )
     SELECT ${COLUMNS} FROM t JOIN categories c ON c.id = t.category_id`,
    [userId, input.categoryId, input.title, input.description, input.startDate, input.endDate],
  )
  if (rows.length === 0) throw new ValidationError([NOT_OWN_CATEGORY]) // BR-13
  return rows[0]
}

// 보낸 필드만 바꾼다: 기존 행을 잠그고 병합 → 검증 → UPDATE 한 번 (FR-08, FR-14)
export async function updateTodo(userId: number, id: number, input: TodoUpdateInput): Promise<TodoBase> {
  return withTransaction(async (client) => {
    const { rows: current } = await client.query<Omit<TodoCreateInput, 'categoryId'> & { categoryId: number; isCompleted: boolean }>(
      `SELECT category_id::int AS "categoryId", title, description, start_date AS "startDate", end_date AS "endDate",
         is_completed AS "isCompleted"
       FROM todos WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [id, userId],
    )
    if (current.length === 0) throw new NotFoundError() // BR-03
    const merged = { ...current[0], ...input }

    // AC-06-3, BR-08: 병합 결과로 검사하고 위반이면 아무것도 바꾸지 않는다
    if (merged.endDate < merged.startDate) throw new ValidationError([END_BEFORE_START])

    let categoryId = current[0].categoryId
    if (input.categoryId !== undefined) {
      const { rows } = await client.query<{ id: string }>(OWN_CATEGORY, [userId, input.categoryId])
      if (rows.length === 0) throw new ValidationError([NOT_OWN_CATEGORY]) // BR-13
      categoryId = Number(rows[0].id)
    }

    const { rows } = await client.query<TodoBase>(
      `WITH t AS (
         UPDATE todos SET category_id = $3, title = $4, description = $5, start_date = $6, end_date = $7,
           is_completed = $8, updated_at = now()
         WHERE id = $1 AND user_id = $2
         RETURNING *
       )
       SELECT ${COLUMNS} FROM t JOIN categories c ON c.id = t.category_id`,
      [id, userId, categoryId, merged.title, merged.description, merged.startDate, merged.endDate, merged.isCompleted],
    )
    return rows[0]
  })
}

export async function deleteTodo(userId: number, id: number): Promise<void> {
  const { rowCount } = await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [id, userId])
  if (rowCount === 0) throw new NotFoundError() // BR-03, AC-07-3
}

// FR-10, OI-09: 본인 할일만. 남의 categoryId는 user_id 조건 때문에 빈 목록이 된다
export async function listTodos(
  userId: number,
  query: { filter: TodoFilter; categoryId: number | null; today: string },
): Promise<Todo[]> {
  const { rows } = await pool.query<Todo>(
    `SELECT ${COLUMNS}, ${STATUS}
     FROM todos t JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1 AND ($3::bigint IS NULL OR t.category_id = $3) AND ${FILTER_SQL[query.filter]}
     ${ORDER}`,
    [userId, query.today, query.categoryId],
  )
  return rows
}

// FR-11, BR-12: 시작일자 <= 월 말일 AND 종료일자 >= 월 1일
export async function listCalendarTodos(userId: number, query: { month: string; today: string }): Promise<Todo[]> {
  const { rows } = await pool.query<Todo>(
    `SELECT ${COLUMNS}, ${STATUS}
     FROM todos t JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
       AND t.start_date <= (($3::text || '-01')::date + interval '1 month' - interval '1 day')::date
       AND t.end_date >= ($3::text || '-01')::date
     ${ORDER}`,
    [userId, query.today, query.month],
  )
  return rows
}
