import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { stubBrowser, mockAdapter } from './helpers.ts'

stubBrowser()
const { api, refreshAccessToken, parseApiError, resetSession } = await import('../src/api/client.ts')
const { useAuthStore } = await import('../src/stores/authStore.ts')
const { useUiStore } = await import('../src/stores/uiStore.ts')
const { queryClient } = await import('../src/api/queryClient.ts')

const auth = () => useAuthStore.getState()
const tick = () => new Promise((r) => setTimeout(r, 5))
const refreshes = (calls: { url: string }[]) => calls.filter((c) => c.url === '/auth/refresh').length

// 'new' 토큰만 통과시키고 refresh 는 'new' 를 준다
const server = async (req: { url: string; auth?: string }) => {
  if (req.url === '/auth/refresh') { await tick(); return [200, { accessToken: 'new' }] as [number, unknown] }
  return (req.auth === 'Bearer new' ? [200, { ok: true }] : [401, { message: 'x' }]) as [number, unknown]
}

beforeEach(() => {
  auth().clear()
  useUiStore.getState().reset()
  queryClient.clear()
})

test('토큰 있으면 Bearer 첨부, 없으면 미첨부', async () => {
  const calls = mockAdapter(api, () => [200, {}])
  await api.get('/users/me')
  auth().setAccessToken('abc')
  await api.get('/users/me')
  assert.equal(calls[0].auth, undefined)
  assert.equal(calls[1].auth, 'Bearer abc')
})

test('401 → refresh 1회 → 새 토큰으로 재시도 성공', async () => {
  auth().setAccessToken('old')
  const calls = mockAdapter(api, server)
  const res = await api.get('/todos')
  assert.deepEqual(res.data, { ok: true })
  assert.equal(refreshes(calls), 1)
  assert.equal(auth().accessToken, 'new')
  assert.deepEqual([calls[0].url, calls[0].auth], ['/todos', 'Bearer old'])
  assert.deepEqual([calls[2].url, calls[2].auth], ['/todos', 'Bearer new'])
})

test('동시 3개 401 → refresh 1회, 모두 성공', async () => {
  auth().setAccessToken('old')
  const calls = mockAdapter(api, server)
  const all = await Promise.all([api.get('/todos'), api.get('/categories'), api.get('/users/me')])
  assert.equal(all.length, 3)
  assert.equal(refreshes(calls), 1)
})

test('refresh 실패 → reject, 토큰 null, page login, 쿼리 데이터 삭제', async () => {
  auth().setAccessToken('old')
  useUiStore.getState().setPage('main')
  queryClient.setQueryData(['me'], { id: 1 })
  const calls = mockAdapter(api, () => [401, { message: 'x' }])
  await assert.rejects(api.get('/todos'))
  assert.equal(refreshes(calls), 1)
  assert.equal(auth().accessToken, null)
  assert.equal(useUiStore.getState().page, 'login')
  assert.equal(queryClient.getQueryData(['me']), undefined)
})

test('재시도도 401 → refresh 추가 없이 reject', async () => {
  auth().setAccessToken('old')
  const calls = mockAdapter(api, (req) => (req.url === '/auth/refresh' ? [200, { accessToken: 'new' }] : [401, {}]))
  await assert.rejects(api.get('/todos'), (e: any) => e.response.status === 401)
  assert.equal(refreshes(calls), 1)
  assert.equal(calls.length, 3)
})

test('/auth/login 401 은 refresh 하지 않는다', async () => {
  const calls = mockAdapter(api, () => [401, { message: '식별자 또는 비밀번호가 올바르지 않습니다' }])
  await assert.rejects(api.post('/auth/login', { email: 'a', password: 'b' }), (e: any) => e.response.status === 401)
  assert.equal(calls.length, 1)
})

test('400 은 그대로 throw', async () => {
  auth().setAccessToken('old')
  const calls = mockAdapter(api, () => [400, { message: '입력값을 확인하세요' }])
  await assert.rejects(api.post('/todos', {}), (e: any) => e.response.status === 400)
  assert.equal(calls.length, 1)
})

test('refreshAccessToken: 동시 호출은 1회, 끝난 뒤 호출은 새 요청', async () => {
  const calls = mockAdapter(api, server)
  const [a, b] = await Promise.all([refreshAccessToken(), refreshAccessToken()])
  assert.equal(a, 'new')
  assert.equal(b, 'new')
  assert.equal(refreshes(calls), 1)
  assert.equal(auth().accessToken, 'new')
  await refreshAccessToken()
  assert.equal(refreshes(calls), 2)
})

test('parseApiError: 네트워크 오류', () => {
  assert.deepEqual(parseApiError(new AxiosError('net', 'ERR_NETWORK', {} as any)), {
    status: null, message: '서버에 연결할 수 없습니다', fields: {},
  })
})

test('parseApiError: 400 필드 오류 (같은 필드는 첫 사유)', () => {
  const err = new AxiosError('x', 'ERR_BAD_REQUEST', {} as any, null, {
    status: 400,
    data: {
      message: '입력값을 확인하세요',
      errors: [
        { field: 'password', reason: '비밀번호는 8~64자여야 합니다' },
        { field: 'password', reason: '비밀번호는 영문과 숫자를 각각 1자 이상 포함해야 합니다' },
        { field: 'email', reason: '이미 사용 중인 이메일입니다' },
      ],
    },
  } as any)
  assert.deepEqual(parseApiError(err), {
    status: 400,
    message: '입력값을 확인하세요',
    fields: { password: '비밀번호는 8~64자여야 합니다', email: '이미 사용 중인 이메일입니다' },
  })
})

test('parseApiError: 응답에 message 없음', () => {
  const err = new AxiosError('x', 'ERR_BAD_RESPONSE', {} as any, null, { status: 502, data: '' } as any)
  assert.deepEqual(parseApiError(err), { status: 502, message: '요청을 처리하지 못했습니다', fields: {} })
})

test('parseApiError: axios 오류 아님', () => {
  assert.deepEqual(parseApiError(new Error('boom')), { status: null, message: '요청을 처리하지 못했습니다', fields: {} })
})

test('resetSession: 토큰·쿼리·화면 초기화, theme 유지', () => {
  auth().setAccessToken('t')
  useUiStore.setState({ page: 'main', tab: 'calendar', theme: 'dark' })
  queryClient.setQueryData(['todos'], [1])
  resetSession()
  assert.equal(auth().accessToken, null)
  assert.equal(queryClient.getQueryData(['todos']), undefined)
  assert.equal(useUiStore.getState().page, 'login')
  assert.equal(useUiStore.getState().tab, 'list')
  assert.equal(useUiStore.getState().theme, 'dark')
})
