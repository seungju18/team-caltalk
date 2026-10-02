import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import type pg from 'pg'
import { config, BCRYPT_COST, ACCESS_TOKEN_TTL_SEC, REFRESH_TOKEN_TTL_SEC } from '../config.ts'
import { pool, withTransaction } from '../db.ts'
import { HttpError, UnauthorizedError, ValidationError } from '../errors.ts'

export type Tokens = { accessToken: string; refreshToken: string }

// BR-02, BR-05: 사용자 + '기본' 카테고리를 하나의 트랜잭션으로 생성
export async function signup(input: { email: string; password: string; name: string }) {
  const hash = await bcrypt.hash(input.password, BCRYPT_COST) // NFR-07
  try {
    return await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: number; email: string; name: string }>(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id::int, email, name',
        [input.email, hash, input.name],
      )
      await client.query("INSERT INTO categories (user_id, name, is_default) VALUES ($1, '기본', true)", [rows[0].id])
      return rows[0]
    })
  } catch (err) {
    // BR-02: 이메일 UNIQUE 위반
    if ((err as { code?: string }).code === '23505') {
      throw new ValidationError([{ field: 'email', reason: '이미 사용 중인 이메일입니다' }])
    }
    throw err
  }
}

// PRD 6.4: Access(본문)·Refresh(쿠키) 발급. DB에는 jti·user_id·expires_at만 저장
export async function issueTokens(client: pg.PoolClient, userId: number): Promise<Tokens> {
  const jti = randomUUID()
  await client.query(
    "INSERT INTO refresh_tokens (jti, user_id, expires_at) VALUES ($1, $2, now() + $3 * interval '1 second')",
    [jti, userId, REFRESH_TOKEN_TTL_SEC],
  )
  const sub = String(userId)
  return {
    accessToken: jwt.sign({ sub, type: 'access' }, config.jwtAccessSecret, {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_TTL_SEC,
    }),
    refreshToken: jwt.sign({ sub, jti, type: 'refresh' }, config.jwtRefreshSecret, {
      algorithm: 'HS256',
      expiresIn: REFRESH_TOKEN_TTL_SEC,
    }),
  }
}

// BR-14: 이메일 없음·비밀번호 틀림을 구분하지 않는다
export async function login(email: string, password: string): Promise<Tokens> {
  const { rows } = await pool.query<{ id: number; password_hash: string }>(
    'SELECT id::int, password_hash FROM users WHERE email = $1',
    [email],
  )
  // ponytail: 이메일 없음은 bcrypt를 건너뛰어 응답 시간이 짧다. 타이밍으로 계정 존재 추측을 막으려면 더미 해시 compare 추가
  if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password_hash))) {
    throw new UnauthorizedError('식별자 또는 비밀번호가 올바르지 않습니다')
  }
  return startSession(rows[0].id)
}

// 로그인 성공 처리 (비밀번호·Google 공용): 만료된 Refresh 정리 후 발급
function startSession(userId: number): Promise<Tokens> {
  return withTransaction(async (client) => {
    await client.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < now()', [userId])
    return issueTokens(client, userId)
  })
}

type GooglePayload = { sub: string; email?: string; email_verified?: boolean }
const googleClient = new OAuth2Client()

// GOOGLE_CLIENT_ID가 비어 있으면 검증하지 않고 실패한다
let verifyGoogleToken = async (idToken: string): Promise<GooglePayload | undefined> => {
  if (!config.googleClientId) return undefined
  const ticket = await googleClient.verifyIdToken({ idToken, audience: config.googleClientId })
  return ticket.getPayload()
}

// 테스트에서 실제 Google 호출 없이 검증 결과를 바꾸기 위한 교체 함수
export function setGoogleVerifier(fn: typeof verifyGoogleToken) {
  verifyGoogleToken = fn
}

const GOOGLE_FAILED = 'Google 인증에 실패했습니다'

// 방식 B: 이미 가입된 계정만. sub로 찾고, 없으면 같은 이메일(대소문자 무시) 계정에 처음 연결한다
export async function googleLogin(credential: string): Promise<Tokens> {
  const payload = await verifyGoogleToken(credential).catch(() => undefined)
  if (!payload || payload.email_verified !== true || !payload.email) throw new UnauthorizedError(GOOGLE_FAILED)

  const linked = await pool.query<{ id: number }>('SELECT id::int FROM users WHERE google_sub = $1', [payload.sub])
  if (linked.rows.length > 0) return startSession(linked.rows[0].id)

  const { rows } = await pool.query<{ id: number; google_sub: string | null }>(
    'SELECT id::int, google_sub FROM users WHERE lower(email) = lower($1)',
    [payload.email],
  )
  if (rows.length === 0) throw new HttpError(404, '가입된 계정이 없습니다. 먼저 회원가입하세요')
  if (rows[0].google_sub !== null) throw new UnauthorizedError(GOOGLE_FAILED)
  await pool.query('UPDATE users SET google_sub = $1 WHERE id = $2', [payload.sub, rows[0].id])
  return startSession(rows[0].id)
}

// 서명·만료·type 검증. 실패 시 null
function verifyRefresh(token: unknown): { userId: number; jti: string } | null {
  if (typeof token !== 'string') return null
  try {
    const payload = jwt.verify(token, config.jwtRefreshSecret, { algorithms: ['HS256'] })
    if (typeof payload === 'string' || payload.type !== 'refresh' || typeof payload.jti !== 'string') return null
    return { userId: Number(payload.sub), jti: payload.jti }
  } catch {
    return null
  }
}

// PRD 6.4: 회전. jti가 DB에 없으면 재사용으로 보고 그 사용자의 Refresh를 전부 폐기
export async function refresh(token: unknown): Promise<Tokens> {
  const claims = verifyRefresh(token)
  if (!claims) throw new UnauthorizedError()
  const tokens = await withTransaction(async (client) => {
    const del = await client.query('DELETE FROM refresh_tokens WHERE jti = $1 AND user_id = $2', [
      claims.jti,
      claims.userId,
    ])
    return del.rowCount === 0 ? null : issueTokens(client, claims.userId)
  })
  if (!tokens) {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [claims.userId])
    throw new UnauthorizedError()
  }
  return tokens
}

// 쿠키가 없거나 무효여도 조용히 끝낸다
export async function logout(token: unknown) {
  const claims = verifyRefresh(token)
  if (claims) await pool.query('DELETE FROM refresh_tokens WHERE jti = $1', [claims.jti])
}
