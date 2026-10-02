import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { app } from '../src/app.ts';
import { pool } from '../src/db.ts';
import { config } from '../src/config.ts';

// 임의 포트로 서버를 띄우고 base URL과 종료 함수를 돌려준다
export async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    base: `http://127.0.0.1:${port}`,
    port,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// 시드 SQL을 다시 적용해 DB를 초기 상태로 되돌린다.
// 개발 DB를 지우지 않도록 테스트 DB(.env.test, 이름이 -test로 끝남)에서만 실행한다
const seedSql = readFileSync(new URL('../db/seed.sql', import.meta.url), 'utf8');
export async function resetDb() {
  if (!new URL(config.databaseUrl).pathname.endsWith('-test')) {
    throw new Error('테스트 DB가 아니다. backend/.env.test 의 DATABASE_URL 을 확인하라');
  }
  await pool.query(seedSql);
}

// Set-Cookie에서 'refreshToken=...' 부분만 꺼낸다 (없으면 빈 문자열)
export function refreshCookie(res: Response) {
  const raw = res.headers.getSetCookie().find((c) => c.startsWith('refreshToken='));
  return raw ? raw.split(';')[0] : '';
}

export async function login(base: string, email = 'me@example.com', password = 'test1234') {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return { accessToken: body.accessToken as string, cookie: refreshCookie(res) };
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
