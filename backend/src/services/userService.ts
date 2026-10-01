import bcrypt from 'bcrypt'
import { BCRYPT_COST } from '../config.ts'
import { pool, withTransaction } from '../db.ts'
import { UnauthorizedError, ValidationError } from '../errors.ts'
import { issueTokens } from './authService.ts'
import type { Tokens } from './authService.ts'

type User = { id: number; email: string; name: string }

// BR-04: 토큰의 사용자 정보만
export async function getMe(userId: number): Promise<User> {
  const { rows } = await pool.query<User>('SELECT id::int, email, name FROM users WHERE id = $1', [userId])
  if (rows.length === 0) throw new UnauthorizedError()
  return rows[0]
}

// BR-16: 이름만 변경. 이메일은 바꾸지 않는다
export async function updateName(userId: number, name: string): Promise<User> {
  const { rows } = await pool.query<User>(
    'UPDATE users SET name = $1 WHERE id = $2 RETURNING id::int, email, name',
    [name, userId],
  )
  if (rows.length === 0) throw new UnauthorizedError()
  return rows[0]
}

// BR-15: 현재 비밀번호 확인 → 새 해시 저장 → Refresh 전부 폐기 → 현재 기기에 새 토큰
export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<Tokens> {
  const { rows } = await pool.query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [
    userId,
  ])
  if (rows.length === 0) throw new UnauthorizedError()
  if (!(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    throw new ValidationError([{ field: 'currentPassword', reason: '현재 비밀번호가 올바르지 않습니다' }])
  }
  const hash = await bcrypt.hash(newPassword, BCRYPT_COST)
  return withTransaction(async (client) => {
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId])
    await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId])
    return issueTokens(client, userId)
  })
}
