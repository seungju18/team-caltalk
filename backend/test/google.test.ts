import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db.ts';
import { setGoogleVerifier } from '../src/services/authService.ts';
import { startServer, resetDb, refreshCookie } from './helpers.ts';

let base: string;
let close: () => Promise<unknown>;

// 실제 Google 호출 대신 credential 문자열로 payload를 고른다
const payloads: Record<string, { sub: string; email?: string; email_verified?: boolean }> = {
  unverified: { sub: 'g-1', email: 'me@example.com', email_verified: false },
  nobody: { sub: 'g-2', email: 'nobody@example.com', email_verified: true },
  me: { sub: 'g-me', email: 'ME@example.com', email_verified: true }, // 대소문자 무시 확인
  meOtherSub: { sub: 'g-other', email: 'me@example.com', email_verified: true },
};

before(async () => {
  await resetDb();
  setGoogleVerifier(async (token) => {
    if (!(token in payloads)) throw new Error('invalid token');
    return payloads[token];
  });
  ({ base, close } = await startServer());
});

after(async () => {
  await close();
  await resetDb();
  await pool.end();
});

const google = (body: unknown) =>
  fetch(`${base}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const subOfMe = async () =>
  (await pool.query("SELECT google_sub FROM users WHERE email = 'me@example.com'")).rows[0].google_sub;

test('GOOGLE credential 누락·빈 문자열은 400 field credential이다', async () => {
  for (const body of [{}, { credential: '' }, { credential: 1 }]) {
    const res = await google(body);
    assert.equal(res.status, 400);
    assert.deepEqual((await res.json()).errors, [{ field: 'credential', reason: 'Google 인증 정보가 필요합니다' }]);
  }
});

test('GOOGLE 토큰 검증 실패는 401이다', async () => {
  const res = await google({ credential: 'forged' });
  assert.equal(res.status, 401);
  assert.equal((await res.json()).message, 'Google 인증에 실패했습니다');
});

test('GOOGLE email_verified가 false면 401이다', async () => {
  const res = await google({ credential: 'unverified' });
  assert.equal(res.status, 401);
  assert.equal((await res.json()).message, 'Google 인증에 실패했습니다');
});

test('GOOGLE 가입되지 않은 이메일은 404다', async () => {
  const res = await google({ credential: 'nobody' });
  assert.equal(res.status, 404);
  assert.equal((await res.json()).message, '가입된 계정이 없습니다. 먼저 회원가입하세요');
});

test('GOOGLE 첫 로그인은 google_sub를 연결하고 200 + refresh 쿠키다', async () => {
  assert.equal(await subOfMe(), null);
  const res = await google({ credential: 'me' });
  assert.equal(res.status, 200);
  assert.ok((await res.json()).accessToken);
  assert.ok(refreshCookie(res));
  assert.equal(await subOfMe(), 'g-me');
});

test('GOOGLE 이미 연결된 sub로 다시 로그인하면 200이다', async () => {
  const res = await google({ credential: 'me' });
  assert.equal(res.status, 200);
  assert.ok(refreshCookie(res));
});

test('GOOGLE 다른 sub가 연결된 계정은 401이고 연결이 바뀌지 않는다', async () => {
  const res = await google({ credential: 'meOtherSub' });
  assert.equal(res.status, 401);
  assert.equal(await subOfMe(), 'g-me');
});
