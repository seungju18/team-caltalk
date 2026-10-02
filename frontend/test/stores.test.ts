import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stubBrowser } from './helpers.ts'

stubBrowser('dark')
const { useUiStore, readTheme } = await import('../src/stores/uiStore.ts')
const { useAuthStore } = await import('../src/stores/authStore.ts')
const { today } = await import('../src/lib/date.ts')

const ui = () => useUiStore.getState()
const todo = { id: 1, title: 'B' } as any

test('uiStore 초기값 (theme 은 localStorage 에서)', () => {
  const s = ui()
  assert.equal(s.page, 'login')
  assert.equal(s.notice, null)
  assert.equal(s.tab, 'list')
  assert.equal(s.filter, 'all')
  assert.equal(s.categoryId, null)
  assert.equal(s.calendarMonth, today().slice(0, 7))
  assert.equal(s.modal, null)
  assert.equal(s.theme, 'dark')
})

test('readTheme: dark / light / 없음 / 접근 오류', () => {
  stubBrowser('dark')
  assert.equal(readTheme(), 'dark')
  stubBrowser('light')
  assert.equal(readTheme(), 'light')
  stubBrowser(null)
  assert.equal(readTheme(), 'light')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('denied') } })
  assert.equal(readTheme(), 'light')
})

test('toggleTheme: classList 와 localStorage 갱신', () => {
  const rec = stubBrowser()
  useUiStore.setState({ theme: 'light' })
  ui().toggleTheme()
  assert.equal(ui().theme, 'dark')
  assert.deepEqual(rec.toggles.at(-1), ['dark', true])
  assert.equal(rec.store.get('theme'), 'dark')
  ui().toggleTheme()
  assert.equal(ui().theme, 'light')
  assert.deepEqual(rec.toggles.at(-1), ['dark', false])
  assert.equal(rec.store.get('theme'), 'light')
})

test('setFilter 와 setCategoryFilter 는 서로를 해제한다', () => {
  ui().reset()
  ui().setCategoryFilter(3)
  assert.equal(ui().categoryId, 3)
  assert.equal(ui().filter, 'all')
  ui().setFilter('overdue')
  assert.equal(ui().filter, 'overdue')
  assert.equal(ui().categoryId, null)
  ui().setCategoryFilter(5)
  assert.equal(ui().filter, 'all')
  assert.equal(ui().categoryId, 5)
})

test('moveMonth: 연도 넘김', () => {
  useUiStore.setState({ calendarMonth: '2026-12' })
  ui().moveMonth(1)
  assert.equal(ui().calendarMonth, '2027-01')
  ui().moveMonth(-2)
  assert.equal(ui().calendarMonth, '2026-11')
})

test('setPage: notice 지정/생략, setTab', () => {
  ui().reset()
  ui().setPage('login', '가입이 완료되었습니다. 로그인하세요')
  assert.equal(ui().page, 'login')
  assert.equal(ui().notice, '가입이 완료되었습니다. 로그인하세요')
  ui().setTab('calendar')
  ui().setPage('category')
  assert.equal(ui().page, 'category')
  assert.equal(ui().notice, null)
  assert.equal(ui().tab, 'calendar') // 직전 탭 유지
})

test('openModal / closeModal', () => {
  ui().openModal({ mode: 'create' })
  assert.deepEqual(ui().modal, { mode: 'create' })
  ui().openModal({ mode: 'edit', todo })
  assert.deepEqual(ui().modal, { mode: 'edit', todo })
  ui().closeModal()
  assert.equal(ui().modal, null)
})

test('reset: theme 만 유지', () => {
  useUiStore.setState({
    page: 'profile', notice: 'x', tab: 'calendar', filter: 'done', categoryId: 2,
    calendarMonth: '2020-01', modal: { mode: 'create' }, theme: 'dark',
  })
  ui().reset()
  const s = ui()
  assert.equal(s.page, 'login')
  assert.equal(s.notice, null)
  assert.equal(s.tab, 'list')
  assert.equal(s.filter, 'all')
  assert.equal(s.categoryId, null)
  assert.equal(s.calendarMonth, today().slice(0, 7))
  assert.equal(s.modal, null)
  assert.equal(s.theme, 'dark')
})

test('authStore: setAccessToken / clear', () => {
  useAuthStore.getState().clear()
  assert.equal(useAuthStore.getState().accessToken, null)
  useAuthStore.getState().setAccessToken('t1')
  assert.equal(useAuthStore.getState().accessToken, 't1')
  useAuthStore.getState().clear()
  assert.equal(useAuthStore.getState().accessToken, null)
})
