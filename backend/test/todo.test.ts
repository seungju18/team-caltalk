import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db.ts';
import { startServer, resetDb, login, authHeaders } from './helpers.ts';

let base: string;
let close: () => Promise<unknown>;
let token: string; // me@example.com

before(async () => {
  await resetDb();
  ({ base, close } = await startServer());
  token = (await login(base)).accessToken;
});

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  await close();
  await pool.end();
});

const req = (method: string, path: string, body?: unknown) =>
  fetch(`${base}/api/todos${path}`, {
    method,
    headers: authHeaders(token),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const hasField = async (res: Response, field: string) =>
  (await res.json()).errors.some((e: { field: string }) => e.field === field);

const todoRow = async (id: number) => (await pool.query('SELECT * FROM todos WHERE id = $1', [id])).rows[0];

const titles = async (query: string) => {
  const res = await req('GET', query);
  assert.equal(res.status, 200, query);
  return (await res.json()).map((t: { title: string }) => t.title).sort();
};

const valid = { title: '새 할일', startDate: '2026-10-10', endDate: '2026-10-11' };

// ---------- BE-07 ----------

test('카테고리 미지정 등록 시 기본 카테고리가 적용된다', async () => {
  const res = await req('POST', '', valid);
  assert.equal(res.status, 201);
  const todo = await res.json();
  assert.equal(todo.categoryId, 1);
  assert.equal(todo.categoryName, '기본');
  assert.equal(todo.isCompleted, false);
});

test('시작일자와 종료일자가 같으면 201이다', async () => {
  const res = await req('POST', '', { ...valid, endDate: '2026-10-10' });
  assert.equal(res.status, 201);
  const todo = await res.json();
  assert.equal(todo.startDate, '2026-10-10');
  assert.equal(todo.endDate, '2026-10-10');
});

test('종료일자 < 시작일자는 400 field endDate다', async () => {
  const res = await req('POST', '', { ...valid, endDate: '2026-10-09' });
  assert.equal(res.status, 400);
  assert.ok(await hasField(res, 'endDate'));
});

test('제목이 공백뿐이면 400 field title이다', async () => {
  const res = await req('POST', '', { ...valid, title: '   ' });
  assert.equal(res.status, 400);
  assert.ok(await hasField(res, 'title'));
});

test('날짜 형식이 틀리거나 없는 날짜면 400이다', async () => {
  for (const startDate of ['2026/10/10', '2026-02-30', 'abc']) {
    const res = await req('POST', '', { ...valid, startDate });
    assert.equal(res.status, 400, startDate);
  }
});

test('설명이 빈 문자열이면 null로 저장된다', async () => {
  const res = await req('POST', '', { ...valid, description: '' });
  assert.equal(res.status, 201);
  const todo = await res.json();
  assert.equal(todo.description, null);
  assert.equal((await todoRow(todo.id)).description, null);
});

test('다른 사용자의 카테고리 지정은 400 field categoryId다', async () => {
  const res = await req('POST', '', { ...valid, categoryId: 2 });
  assert.equal(res.status, 400);
  assert.ok(await hasField(res, 'categoryId'));
});

test('다른 사용자의 할일 수정·삭제는 404이고 데이터가 바뀌지 않는다', async () => {
  const before = await todoRow(7);
  assert.equal((await req('PATCH', '/7', { title: '탈취' })).status, 404);
  assert.equal((await req('DELETE', '/7')).status, 404);
  assert.deepEqual(await todoRow(7), before);
});

test('AC-06-3 수정이 거부되면 저장된 값이 바뀌지 않는다', async () => {
  const before = await todoRow(1);
  // A는 09-25~09-28. 종료일자만 시작일자보다 앞으로 바꾸면 병합 후 위반
  const res = await req('PATCH', '/1', { title: '바뀌면 안 됨', endDate: '2026-09-20' });
  assert.equal(res.status, 400);
  assert.deepEqual(await todoRow(1), before);
});

test('수정 성공 시 updatedAt이 증가한다', async () => {
  const before = await todoRow(1);
  const res = await req('PATCH', '/1', { title: '할일 A 수정' });
  assert.equal(res.status, 200);
  const todo = await res.json();
  assert.equal(todo.title, '할일 A 수정');
  assert.ok(new Date(todo.updatedAt) > before.updated_at);
});

test('AC-06-2 E 완료 해제 후 목록에서 status가 not_started다', async () => {
  const res = await req('PATCH', '/5', { isCompleted: false });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).isCompleted, false);
  const list = await (await req('GET', '?filter=all&today=2026-10-01')).json();
  assert.equal(list.find((t: { id: number }) => t.id === 5).status, 'not_started');
});

test('빈 PATCH 본문은 400이다', async () => {
  assert.equal((await req('PATCH', '/1', {})).status, 400);
});

test('삭제는 204이고 목록에서 사라진다', async () => {
  assert.equal((await req('DELETE', '/1')).status, 204);
  assert.ok(!(await titles('?filter=all&today=2026-10-01')).includes('할일 A'));
});

// ---------- BE-08 ----------

test('AC-08 today=2026-10-01 필터 결과가 일치한다', async () => {
  const t = (f: string) => titles(`?filter=${f}&today=2026-10-01`);
  assert.deepEqual(await t('all'), ['할일 A', '할일 B', '할일 C', '할일 D', '할일 E', '할일 F']);
  assert.deepEqual(await t('overdue'), ['할일 A']);
  assert.deepEqual(await t('in_progress'), ['할일 B', '할일 C']);
  assert.deepEqual(await t('not_started'), ['할일 D']);
  assert.deepEqual(await t('done'), ['할일 E', '할일 F']);
  assert.deepEqual(await titles('?filter=all&categoryId=3&today=2026-10-01'), ['할일 A', '할일 B']);
});

test('AC-08-7 today=2026-10-02 지연은 A, C다', async () => {
  assert.deepEqual(await titles('?filter=overdue&today=2026-10-02'), ['할일 A', '할일 C']);
});

test('AC-09 월 조회 결과가 일치한다', async () => {
  assert.deepEqual(await titles('/calendar?month=2026-10&today=2026-10-01'), ['할일 B', '할일 C', '할일 D', '할일 E']);
  assert.deepEqual(await titles('/calendar?month=2026-09&today=2026-10-01'), ['할일 A', '할일 B', '할일 F']);
});

test('잘못된 조회 파라미터는 400이다', async () => {
  const bad = [
    '?filter=bad&today=2026-10-01',
    '?filter=all',
    '?filter=all&today=2026-1-1',
    '/calendar?month=2026-1&today=2026-10-01',
    '?filter=done&categoryId=3&today=2026-10-01',
  ];
  for (const q of bad) assert.equal((await req('GET', q)).status, 400, q);
});

test('남의 카테고리로 조회하면 빈 배열이다', async () => {
  assert.deepEqual(await titles('?filter=all&categoryId=2&today=2026-10-01'), []);
});

test('목록은 종료일자 오름차순이다', async () => {
  const list = await (await req('GET', '?filter=all&today=2026-10-01')).json();
  const ends = list.map((t: { endDate: string }) => t.endDate);
  assert.deepEqual(ends, [...ends].sort());
});
