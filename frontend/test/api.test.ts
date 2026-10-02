import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stubBrowser, mockAdapter } from './helpers.ts'

stubBrowser()
const { api } = await import('../src/api/client.ts')
const auth = await import('../src/api/auth.ts')
const users = await import('../src/api/users.ts')
const cats = await import('../src/api/categories.ts')
const todos = await import('../src/api/todos.ts')

const body = { title: 'B', description: null, categoryId: null, startDate: '2026-09-30', endDate: '2026-10-02' }

// [이름, 호출, method, url, params, data, 반환값 검사 여부(void 함수는 제외)]
const cases: [string, () => Promise<unknown>, string, string, unknown, unknown, boolean][] = [
  ['signup', () => auth.signup({ email: 'me@example.com', password: 'test1234', name: '본인' }), 'post', '/auth/signup', undefined, { email: 'me@example.com', password: 'test1234', name: '본인' }, true],
  ['login', () => auth.login({ email: 'me@example.com', password: 'test1234' }), 'post', '/auth/login', undefined, { email: 'me@example.com', password: 'test1234' }, true],
  ['googleLogin', () => auth.googleLogin('id-token'), 'post', '/auth/google', undefined, { credential: 'id-token' }, true],
  ['logout', () => auth.logout(), 'post', '/auth/logout', undefined, undefined, false],
  ['getMe', () => users.getMe(), 'get', '/users/me', undefined, undefined, true],
  ['updateMe', () => users.updateMe({ name: '새이름' }), 'patch', '/users/me', undefined, { name: '새이름' }, true],
  ['changePassword', () => users.changePassword({ currentPassword: 'test1234', newPassword: 'abcd1234' }), 'put', '/users/me/password', undefined, { currentPassword: 'test1234', newPassword: 'abcd1234' }, true],
  ['listCategories', () => cats.listCategories(), 'get', '/categories', undefined, undefined, true],
  ['createCategory', () => cats.createCategory('업무'), 'post', '/categories', undefined, { name: '업무' }, true],
  ['renameCategory', () => cats.renameCategory(3, '개인'), 'patch', '/categories/3', undefined, { name: '개인' }, true],
  ['deleteCategory', () => cats.deleteCategory(3), 'delete', '/categories/3', undefined, undefined, false],
  ['listTodos null', () => todos.listTodos({ filter: 'all', categoryId: null, today: '2026-10-01' }), 'get', '/todos', { filter: 'all', today: '2026-10-01' }, undefined, true],
  ['listTodos 숫자', () => todos.listTodos({ filter: 'all', categoryId: 2, today: '2026-10-01' }), 'get', '/todos', { filter: 'all', today: '2026-10-01', categoryId: 2 }, undefined, true],
  ['listCalendarTodos', () => todos.listCalendarTodos('2026-10', '2026-10-01'), 'get', '/todos/calendar', { month: '2026-10', today: '2026-10-01' }, undefined, true],
  ['createTodo', () => todos.createTodo(body), 'post', '/todos', undefined, body, true],
  ['updateTodo', () => todos.updateTodo(7, { isCompleted: true }), 'patch', '/todos/7', undefined, { isCompleted: true }, true],
  ['deleteTodo', () => todos.deleteTodo(7), 'delete', '/todos/7', undefined, undefined, false],
]

for (const [name, call, method, url, params, data, checkResult] of cases) {
  test(`${name}: ${method.toUpperCase()} ${url}`, async () => {
    const reply = { from: name }
    const calls = mockAdapter(api, () => [200, reply])
    const result = await call()
    assert.equal(calls.length, 1)
    const [req] = calls
    assert.equal(req.method, method)
    assert.equal(req.url, url)
    assert.deepEqual(req.params, params) // categoryId null 이면 키 자체가 없어야 한다
    assert.deepEqual(req.data, data)
    if (checkResult) assert.deepEqual(result, reply)
  })
}

test('FILTER_LABELS', () => {
  assert.deepEqual(todos.FILTER_LABELS, { all: '전체', not_started: '시작 전', in_progress: '진행 중', done: '완료', overdue: '지연' })
})
