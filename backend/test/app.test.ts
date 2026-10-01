import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { app } from '../src/app.ts';
import { config } from '../src/config.ts';
import { pool, withTransaction } from '../src/db.ts';
import { HttpError, ValidationError, UnauthorizedError, NotFoundError } from '../src/errors.ts';

let server: Server;
let base: string;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

const postJson = (body: string) =>
  fetch(`${base}/api/health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

test('GET /api/health는 200과 status ok를 반환한다', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('DATE 컬럼은 문자열로 파싱된다', async () => {
  const { rows } = await pool.query("SELECT '2026-10-01'::date AS d");
  assert.equal(typeof rows[0].d, 'string');
  assert.equal(rows[0].d, '2026-10-01');
});

test('withTransaction은 성공 시 콜백 반환값을 돌려준다', async () => {
  const result = await withTransaction(async (client) => {
    const { rows } = await client.query('SELECT 1 AS n');
    return rows[0].n;
  });
  assert.equal(result, 1);
});

test('withTransaction은 콜백이 throw하면 같은 오류로 reject한다', async () => {
  const err = new Error('실패');
  await assert.rejects(
    withTransaction(async (client) => {
      await client.query('SELECT 1');
      throw err;
    }),
    (e) => e === err,
  );
  // 롤백 후에도 풀이 정상 동작
  const { rows } = await pool.query('SELECT 1 AS n');
  assert.equal(rows[0].n, 1);
});

test('100KB 초과 JSON 본문은 413을 반환한다', async () => {
  const res = await postJson(JSON.stringify({ a: 'x'.repeat(110 * 1024) }));
  assert.equal(res.status, 413);
  assert.ok((await res.json()).message);
});

test('잘못된 JSON 본문은 400을 반환한다', async () => {
  const res = await postJson('{bad json');
  assert.equal(res.status, 400);
  assert.ok((await res.json()).message);
});

test('오류 클래스는 status와 errors를 보존한다', () => {
  const errors = [{ field: 'email', reason: '형식 오류' }];
  const v = new ValidationError(errors);
  assert.equal(v.status, 400);
  assert.equal(v.message, '입력값을 확인하세요');
  assert.deepEqual(v.errors, errors);

  const u = new UnauthorizedError();
  const n = new NotFoundError();
  assert.equal(u.status, 401);
  assert.equal(n.status, 404);
  for (const e of [v, u, n]) assert.ok(e instanceof HttpError);
});

test('CORS: 허용 출처는 preflight 204와 헤더, 그 외 출처는 헤더 없음', { skip: !config.corsOrigins[0] && 'CORS_ORIGIN 미설정' }, async () => {
  const origin = config.corsOrigins[0];
  const pre = await fetch(`${base}/api/todos`, { method: 'OPTIONS', headers: { Origin: origin } });
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), origin);
  assert.equal(pre.headers.get('access-control-allow-credentials'), 'true');
  assert.match(pre.headers.get('access-control-allow-headers') ?? '', /Authorization/);
  const get = await fetch(`${base}/api/health`, { headers: { Origin: origin } });
  assert.equal(get.headers.get('access-control-allow-origin'), origin);
  const other = await fetch(`${base}/api/health`, { headers: { Origin: 'http://evil.example' } });
  assert.equal(other.headers.get('access-control-allow-origin'), null);
});

// 풀을 종료하므로 반드시 마지막에 둔다
test('처리되지 않은 예외는 500 JSON을 반환하고 서버는 계속 응답한다', async () => {
  await pool.end();
  for (let i = 0; i < 2; i++) {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 500);
    assert.ok((await res.json()).message);
  }
});
