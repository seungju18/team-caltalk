import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db.ts';
import { startServer, resetDb, login, authHeaders } from './helpers.ts';

let base: string;
let close: () => Promise<unknown>;
let token: string; // me@example.com
let otherToken: string; // other@example.com

before(async () => {
  await resetDb();
  ({ base, close } = await startServer());
  token = (await login(base)).accessToken;
  otherToken = (await login(base, 'other@example.com')).accessToken;
});

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  await close();
  await pool.end();
});

const req = (method: string, path: string, body?: unknown, t = token) =>
  fetch(`${base}/api/categories${path}`, {
    method,
    headers: authHeaders(t),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const categoryRows = async () =>
  (await pool.query('SELECT id::int, user_id::int, name, is_default FROM categories ORDER BY id')).rows;

test('목록에는 본인 카테고리만 있고 기본이 포함된다', async () => {
  const res = await req('GET', '');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), [
    { id: 1, name: '기본', isDefault: true },
    { id: 3, name: '업무', isDefault: false },
  ]);
});

test('생성은 201 Category를 반환한다', async () => {
  const res = await req('POST', '', { name: '개인' });
  assert.equal(res.status, 201);
  const cat = await res.json();
  assert.equal(cat.name, '개인');
  assert.equal(cat.isDefault, false);
});

test('소유자 내 중복 이름 생성은 400 field name이다', async () => {
  const res = await req('POST', '', { name: '업무' });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).errors.some((e: { field: string }) => e.field === 'name'));
});

test('소유자 내 중복 이름으로 변경은 400이고 이름이 그대로다', async () => {
  await req('POST', '', { name: '개인' });
  const res = await req('PATCH', '/3', { name: '개인' });
  assert.equal(res.status, 400);
  const { rows } = await pool.query('SELECT name FROM categories WHERE id = 3');
  assert.equal(rows[0].name, '업무');
});

test('다른 사용자는 같은 이름 업무를 만들 수 있다', async () => {
  const res = await req('POST', '', { name: '업무' }, otherToken);
  assert.equal(res.status, 201);
});

test('기본 카테고리 이름 변경·삭제는 400이고 데이터가 바뀌지 않는다', async () => {
  const before = await categoryRows();
  const patch = await req('PATCH', '/1', { name: '바꿈' });
  assert.equal(patch.status, 400);
  assert.ok((await patch.json()).errors.some((e: { field: string }) => e.field === 'name'));
  assert.equal((await req('DELETE', '/1')).status, 400);
  assert.deepEqual(await categoryRows(), before);
});

test('업무 삭제는 204이고 A·B는 기본으로 옮겨지며 할일 6건이 유지된다', async () => {
  assert.equal((await req('DELETE', '/3')).status, 204);
  const a = await pool.query('SELECT id::int, category_id::int FROM todos WHERE id IN (1, 2) ORDER BY id');
  assert.deepEqual(a.rows, [
    { id: 1, category_id: 1 },
    { id: 2, category_id: 1 },
  ]);
  const n = await pool.query('SELECT count(*)::int AS n FROM todos WHERE user_id = 1');
  assert.equal(n.rows[0].n, 6);
  assert.equal((await pool.query('SELECT 1 FROM categories WHERE id = 3')).rowCount, 0);
});

test('다른 사용자의 카테고리 변경·삭제는 404이고 데이터가 바뀌지 않는다', async () => {
  const before = await categoryRows();
  assert.equal((await req('PATCH', '/2', { name: '탈취' })).status, 404);
  assert.equal((await req('DELETE', '/2')).status, 404);
  assert.deepEqual(await categoryRows(), before);
});

test('존재하지 않거나 정수가 아닌 id는 404다', async () => {
  for (const id of ['999', 'abc']) {
    assert.equal((await req('PATCH', `/${id}`, { name: '없음' })).status, 404, id);
    assert.equal((await req('DELETE', `/${id}`)).status, 404, id);
  }
});

test('AC-10-1 업무를 회사로 바꾸면 할일 목록의 categoryName이 회사다', async () => {
  const res = await req('PATCH', '/3', { name: '회사' });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).name, '회사');

  const list = await fetch(`${base}/api/todos?filter=all&categoryId=3&today=2026-10-01`, {
    headers: authHeaders(token),
  });
  const todos = await list.json();
  assert.equal(todos.length, 2);
  for (const t of todos) assert.equal(t.categoryName, '회사');
});
