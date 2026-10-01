import pg from 'pg'
import { pool, withTransaction } from '../db.ts'
import { NotFoundError, ValidationError } from '../errors.ts'

type Category = { id: number; name: string; isDefault: boolean }

const COLUMNS = 'id::int AS id, name, is_default AS "isDefault"'
const DUPLICATE = { field: 'name', reason: '이미 있는 카테고리 이름입니다' }

// 도메인 3.2: (user_id, name) UNIQUE 위반을 400으로 바꾼다
function rethrowDuplicate(err: unknown): never {
  if (err instanceof pg.DatabaseError && err.code === '23505') throw new ValidationError([DUPLICATE])
  throw err
}

// BR-03: 본인 카테고리만 찾는다. 없으면 404, '기본'이면 400 (BR-17)
async function assertEditable(db: pg.Pool | pg.PoolClient, userId: number, id: number, reason: string): Promise<void> {
  const { rows } = await db.query<{ isDefault: boolean }>(
    'SELECT is_default AS "isDefault" FROM categories WHERE id = $1 AND user_id = $2',
    [id, userId],
  )
  if (rows.length === 0) throw new NotFoundError()
  if (rows[0].isDefault) throw new ValidationError([{ field: 'name', reason }])
}

export async function listCategories(userId: number): Promise<Category[]> {
  const { rows } = await pool.query<Category>(`SELECT ${COLUMNS} FROM categories WHERE user_id = $1 ORDER BY id`, [
    userId,
  ])
  return rows
}

export async function createCategory(userId: number, name: string): Promise<Category> {
  try {
    const { rows } = await pool.query<Category>(
      `INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING ${COLUMNS}`,
      [userId, name],
    )
    return rows[0]
  } catch (err) {
    rethrowDuplicate(err)
  }
}

export async function renameCategory(userId: number, id: number, name: string): Promise<Category> {
  await assertEditable(pool, userId, id, "'기본' 카테고리는 변경할 수 없습니다")
  let rows: Category[]
  try {
    ;({ rows } = await pool.query<Category>(
      `UPDATE categories SET name = $3 WHERE id = $1 AND user_id = $2 AND NOT is_default RETURNING ${COLUMNS}`,
      [id, userId, name],
    ))
  } catch (err) {
    rethrowDuplicate(err)
  }
  if (rows.length === 0) throw new NotFoundError() // 조회와 변경 사이에 삭제된 경우
  return rows[0]
}

// BR-18: 소속 할일을 본인 '기본'으로 옮긴 뒤 삭제한다 (하나의 트랜잭션)
export async function deleteCategory(userId: number, id: number): Promise<void> {
  await withTransaction(async (client) => {
    await assertEditable(client, userId, id, "'기본' 카테고리는 삭제할 수 없습니다")
    await client.query(
      `UPDATE todos SET category_id = (SELECT id FROM categories WHERE user_id = $2 AND is_default)
       WHERE user_id = $2 AND category_id = $1`,
      [id, userId],
    )
    await client.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId])
  })
}
