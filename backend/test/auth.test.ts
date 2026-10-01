import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { config } from '../src/config.ts';
import { pool } from '../src/db.ts';
import { resetLoginLimit } from '../src/middleware/loginLimit.ts';
import { startServer, resetDb, login, authHeaders, refreshCookie } from './helpers.ts';

let base: string;
let port: number;
let close: () => Promise<unknown>;

before(async () => {
  await resetDb();
  resetLoginLimit();
  ({ base, port, close } = await startServer());
});

after(async () => {
  resetLoginLimit();
  await close();
  await pool.end();
});

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const refresh = (cookie: string) =>
  fetch(`${base}/api/auth/refresh`, { method: 'POST', headers: cookie ? { Cookie: cookie } : {} });

const me = (token: string) => fetch(`${base}/api/users/me`, { headers: authHeaders(token) });

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

// ---------- BE-03 ----------

test('BE-03 Authorization 헤더가 없으면 401이다', async () => {
  const res = await fetch(`${base}/api/users/me`);
  assert.equal(res.status, 401);
});

test('BE-03 만료·위조·refresh 타입·alg none·HS512 토큰은 401이다', async () => {
  const past = Math.floor(Date.now() / 1000) - 60;
  const tokens = [
    jwt.sign({ sub: '1', type: 'access', exp: past }, config.jwtAccessSecret),
    jwt.sign({ sub: '1', type: 'access' }, 'wrong-secret'),
    jwt.sign({ sub: '1', type: 'refresh' }, config.jwtAccessSecret),
    `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: '1', type: 'access' })}.`,
    jwt.sign({ sub: '1', type: 'access' }, config.jwtAccessSecret, { algorithm: 'HS512' }),
  ];
  for (const t of tokens) {
    assert.equal((await me(t)).status, 401);
  }
});

test('BE-03 유효한 토큰이면 /api/users/me가 본인 정보를 반환한다', async () => {
  const token = jwt.sign({ sub: '1', type: 'access' }, config.jwtAccessSecret, { expiresIn: 60 });
  const res = await me(token);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).email, 'me@example.com');
});

test('BE-03 카테고리·할일·내 정보는 인증 없이 401이다', async () => {
  for (const path of ['/api/categories', '/api/todos?today=2026-10-01', '/api/users/me']) {
    assert.equal((await fetch(`${base}${path}`)).status, 401, path);
  }
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
});

// ---------- BE-04 ----------

test('BE-04 정상 가입은 201이고 사용자 1행과 기본 카테고리 1행이 생긴다', async () => {
  const res = await post('/api/auth/signup', { email: 'new@example.com', password: 'abcd1234', name: '신규' });
  assert.equal(res.status, 201);
  const user = await res.json();
  assert.deepEqual(Object.keys(user).sort(), ['email', 'id', 'name']);
  assert.equal(user.email, 'new@example.com');
  assert.equal(user.name, '신규');

  const users = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['new@example.com']);
  assert.equal(users.rowCount, 1);
  const cats = await pool.query('SELECT name, is_default FROM categories WHERE user_id = $1', [user.id]);
  assert.deepEqual(cats.rows, [{ name: '기본', is_default: true }]);
});

test('BE-04 비밀번호는 해시로 저장된다', async () => {
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['new@example.com']);
  assert.notEqual(rows[0].password_hash, 'abcd1234');
  assert.ok(rows[0].password_hash.startsWith('$2'));
});

test('BE-04 중복 이메일은 400이고 사유가 email에 달린다', async () => {
  const res = await post('/api/auth/signup', { email: 'me@example.com', password: 'abcd1234', name: '중복' });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.errors.some((e: { field: string }) => e.field === 'email'));
});

test('BE-04 제약 위반은 400 + 항목별 사유이며 DB에 행이 생기지 않는다', async () => {
  const before = (await pool.query('SELECT count(*)::int AS n FROM users')).rows[0].n;
  const cases = [
    { field: 'email', body: { email: 'not-an-email', password: 'abcd1234', name: '가' } },
    { field: 'password', body: { email: 'p1@example.com', password: 'abc123', name: '가' } },
    { field: 'password', body: { email: 'p2@example.com', password: 'abcdefgh', name: '가' } },
    { field: 'password', body: { email: 'p3@example.com', password: '12345678', name: '가' } },
    { field: 'name', body: { email: 'n1@example.com', password: 'abcd1234', name: '   ' } },
  ];
  for (const c of cases) {
    const res = await post('/api/auth/signup', c.body);
    assert.equal(res.status, 400, c.field);
    const body = await res.json();
    const err = body.errors.find((e: { field: string }) => e.field === c.field);
    assert.ok(err?.reason, c.field);
  }
  const after = (await pool.query('SELECT count(*)::int AS n FROM users')).rows[0].n;
  assert.equal(after, before);
});

// ---------- BE-05 ----------

test('BE-05 이메일 없음과 비밀번호 틀림은 같은 401과 같은 문구다', async () => {
  const a = await post('/api/auth/login', { email: 'nobody@example.com', password: 'test1234' });
  const b = await post('/api/auth/login', { email: 'me@example.com', password: 'wrong1234' });
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.equal((await a.json()).message, (await b.json()).message);
});

test('BE-05 로그인 응답에 accessToken과 PRD 6.4 속성의 refresh 쿠키가 있다', async () => {
  const res = await post('/api/auth/login', { email: 'me@example.com', password: 'test1234' });
  assert.equal(res.status, 200);
  assert.ok((await res.json()).accessToken);
  const raw = res.headers.getSetCookie().find((c) => c.startsWith('refreshToken='));
  assert.ok(raw);
  assert.match(raw, /;\s*HttpOnly/i);
  assert.match(raw, /;\s*SameSite=Strict/i);
  assert.match(raw, /;\s*Path=\/api\/auth/i);
  assert.doesNotMatch(raw, /;\s*Secure/i); // 개발 환경
});

test('BE-05 재발급 후 이전 쿠키로 재발급하면 401이고 사용자 refresh 행이 0개다', async () => {
  const { cookie } = await login(base);
  const r1 = await refresh(cookie);
  assert.equal(r1.status, 200);
  assert.ok((await r1.json()).accessToken);
  assert.ok(refreshCookie(r1));

  const r2 = await refresh(cookie);
  assert.equal(r2.status, 401);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM refresh_tokens WHERE user_id = 1');
  assert.equal(rows[0].n, 0);
});

test('BE-05 로그아웃은 204이고 같은 쿠키로 재발급하면 401이다', async () => {
  const { cookie } = await login(base);
  const out = await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
  assert.equal(out.status, 204);
  assert.equal((await refresh(cookie)).status, 401);
});

test('BE-05 refresh_tokens에는 jti·user_id·expires_at만 있고 토큰 원문이 없다', async () => {
  const { cookie } = await login(base);
  const token = cookie.slice('refreshToken='.length);
  const cols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'refresh_tokens'",
  );
  assert.deepEqual(cols.rows.map((r) => r.column_name).sort(), ['expires_at', 'jti', 'user_id']);
  const { rows } = await pool.query('SELECT * FROM refresh_tokens');
  assert.ok(!JSON.stringify(rows).includes(token));
});

test('BE-05 쿠키 없이 재발급은 401, 로그아웃은 204다', async () => {
  assert.equal((await refresh('')).status, 401);
  assert.equal((await fetch(`${base}/api/auth/logout`, { method: 'POST' })).status, 204);
});

// ---------- BE-09 ----------

const patchMe = (token: string, body: unknown) =>
  fetch(`${base}/api/users/me`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(body) });

const putPassword = (token: string, body: unknown) =>
  fetch(`${base}/api/users/me/password`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(body) });

const hashOfMe = async () =>
  (await pool.query("SELECT password_hash FROM users WHERE email = 'me@example.com'")).rows[0].password_hash;

test('BE-09 이름이 공백뿐이면 400 field name이다', async () => {
  const { accessToken } = await login(base);
  const res = await patchMe(accessToken, { name: '   ' });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).errors.some((e: { field: string }) => e.field === 'name'));
});

test('BE-09 이름 변경은 200이고 email 필드를 보내도 이메일은 바뀌지 않는다', async () => {
  const { accessToken } = await login(base);
  const res = await patchMe(accessToken, { name: '새이름', email: 'changed@example.com' });
  assert.equal(res.status, 200);
  const user = await res.json();
  assert.equal(user.name, '새이름');
  assert.equal(user.email, 'me@example.com');
  const { rows } = await pool.query('SELECT email, name FROM users WHERE id = 1');
  assert.deepEqual(rows[0], { email: 'me@example.com', name: '새이름' });
});

test('BE-09 현재 비밀번호가 틀리면 400 field currentPassword이고 해시가 그대로다', async () => {
  const { accessToken } = await login(base);
  const hash = await hashOfMe();
  const res = await putPassword(accessToken, { currentPassword: 'wrong1234', newPassword: 'newpass123' });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).errors.some((e: { field: string }) => e.field === 'currentPassword'));
  assert.equal(await hashOfMe(), hash);
});

test('BE-09 새 비밀번호 규칙 위반은 400 field newPassword다', async () => {
  const { accessToken } = await login(base);
  const res = await putPassword(accessToken, { currentPassword: 'test1234', newPassword: 'short' });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).errors.some((e: { field: string }) => e.field === 'newPassword'));
});

test('BE-09 비밀번호 변경 성공 시 다른 기기는 재발급 401, 변경한 기기는 새 토큰으로 계속 사용한다', async () => {
  const other = await login(base); // 다른 기기
  const { accessToken } = await login(base);
  const res = await putPassword(accessToken, { currentPassword: 'test1234', newPassword: 'newpass123' });
  assert.equal(res.status, 200);
  const newAccess = (await res.json()).accessToken;
  const newCookie = refreshCookie(res);
  assert.ok(newAccess);
  assert.ok(newCookie);

  // 다른 기기의 옛 Refresh는 재사용 감지로 전부 삭제되므로 변경한 기기를 먼저 확인한다 (8-plan BE-09)
  assert.equal((await me(newAccess)).status, 200);
  assert.equal((await refresh(newCookie)).status, 200);
  assert.equal((await refresh(other.cookie)).status, 401);
});

// ---------- BE-10 ----------
// 비밀번호가 바뀐 상태이므로 test1234 로그인은 모두 실패(401)한다

const failLogin = (host = base) =>
  fetch(`${host}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'me@example.com', password: 'wrong1234' }),
  });

test('BE-10 같은 IP에서 1분 안에 10번 실패 후 11번째는 429다', async () => {
  resetLoginLimit();
  for (let i = 0; i < 10; i++) assert.equal((await failLogin()).status, 401, `${i + 1}번째`);
  assert.equal((await failLogin()).status, 429);
});

test('BE-10 다른 IP는 영향을 받지 않는다', async () => {
  // 직전 테스트로 127.0.0.1은 제한 상태. IPv6 루프백(::1)은 다른 IP다.
  assert.equal((await failLogin()).status, 429);
  assert.equal((await failLogin(`http://[::1]:${port}`)).status, 401);
});

test('BE-10 1분이 지나면 다시 로그인을 시도할 수 있다', async () => {
  resetLoginLimit();
  for (let i = 0; i < 10; i++) await failLogin();
  assert.equal((await failLogin()).status, 429);

  const now = Date.now();
  mock.method(Date, 'now', () => now + 61_000);
  try {
    assert.equal((await failLogin()).status, 401);
  } finally {
    mock.restoreAll();
  }
});
