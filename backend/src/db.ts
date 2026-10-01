import pg from 'pg'
import { config, DB_POOL_MAX } from './config.ts'

// PRD 7.3, R-05: DATE(OID 1082)를 Date 객체로 바꾸지 않고 'YYYY-MM-DD' 문자열 그대로 받는다
pg.types.setTypeParser(1082, (v) => v)

// NFR-05: 커넥션 풀 최대 크기
export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: DB_POOL_MAX })

// 하나의 클라이언트로 BEGIN/COMMIT을 감싼다. 오류 시 ROLLBACK 후 다시 던진다.
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
