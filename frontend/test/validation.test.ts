import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validatePassword, validateName, validateCategoryName, validateSignup, validateTodo,
} from '../src/lib/validation.ts'

const PW_LEN = '비밀번호는 8~64자여야 합니다'
const PW_MIX = '비밀번호는 영문과 숫자를 각각 1자 이상 포함해야 합니다'
const NAME = '이름은 1~30자여야 합니다'
const CAT = '카테고리 이름은 1~20자여야 합니다'
const EMAIL = '이메일 형식이 올바르지 않습니다 (최대 254자)'
const TITLE = '제목은 1~100자여야 합니다'
const DESC = '설명은 최대 1000자입니다'
const DATE = '날짜를 입력하세요'
const END = '종료일자는 시작일자보다 빠를 수 없습니다'

test('validatePassword: 길이 7/8/64/65', () => {
  assert.equal(validatePassword('abc1234'), PW_LEN)
  assert.equal(validatePassword('abcd1234'), null)
  assert.equal(validatePassword('a'.repeat(63) + '1'), null)
  assert.equal(validatePassword('a'.repeat(64) + '1'), PW_LEN)
})

test('validatePassword: 영문·숫자 포함, 길이 먼저', () => {
  assert.equal(validatePassword('abcdefgh'), PW_MIX)
  assert.equal(validatePassword('12345678'), PW_MIX)
  assert.equal(validatePassword('abc'), PW_LEN)
})

test('validateName: 공백/30/31, 문자 단위', () => {
  assert.equal(validateName('   '), NAME)
  assert.equal(validateName(''), NAME)
  assert.equal(validateName('a'.repeat(30)), null)
  assert.equal(validateName('a'.repeat(31)), NAME)
  assert.equal(validateName(' 본인 '), null)
  assert.equal(validateName('\u{1F600}'.repeat(30)), null) // 서로게이트 쌍 30자
})

test('validateCategoryName: 20/21', () => {
  assert.equal(validateCategoryName('a'.repeat(20)), null)
  assert.equal(validateCategoryName('a'.repeat(21)), CAT)
  assert.equal(validateCategoryName('  '), CAT)
})

test('validateSignup: 정상, 이메일 형식·254/255, 다중 오류', () => {
  const ok = { email: 'me@example.com', password: 'test1234', name: '본인' }
  assert.deepEqual(validateSignup(ok), {})
  assert.deepEqual(validateSignup({ ...ok, email: 'abc' }), { email: EMAIL })
  assert.deepEqual(validateSignup({ ...ok, email: 'a b@example.com' }), { email: EMAIL })
  assert.deepEqual(validateSignup({ ...ok, email: 'a'.repeat(242) + '@example.com' }), {})
  assert.deepEqual(validateSignup({ ...ok, email: 'a'.repeat(243) + '@example.com' }), { email: EMAIL })
  assert.deepEqual(validateSignup({ email: '', password: 'short', name: ' ' }), {
    email: EMAIL, password: PW_LEN, name: NAME,
  })
})

const todo = { title: '보고서', description: '', startDate: '2026-10-01', endDate: '2026-10-03' }

test('validateTodo: 정상, 같은 날·과거 날짜 허용 (AC-05-3)', () => {
  assert.deepEqual(validateTodo(todo), {})
  assert.deepEqual(validateTodo({ ...todo, endDate: '2026-10-01' }), {})
  assert.deepEqual(validateTodo({ ...todo, startDate: '2026-09-01', endDate: '2026-09-02' }), {})
})

test('validateTodo: 제목 공백/100/101, 설명 1000/1001 (AC-05-5)', () => {
  assert.deepEqual(validateTodo({ ...todo, title: '   ' }), { title: TITLE })
  assert.deepEqual(validateTodo({ ...todo, title: 'a'.repeat(100) }), {})
  assert.deepEqual(validateTodo({ ...todo, title: 'a'.repeat(101) }), { title: TITLE })
  assert.deepEqual(validateTodo({ ...todo, description: 'a'.repeat(1000) }), {})
  assert.deepEqual(validateTodo({ ...todo, description: 'a'.repeat(1001) }), { description: DESC })
})

test('validateTodo: 날짜 빈값', () => {
  assert.deepEqual(validateTodo({ ...todo, startDate: '' }), { startDate: DATE })
  assert.deepEqual(validateTodo({ ...todo, endDate: '' }), { endDate: DATE })
})

test('validateTodo: 종료일 < 시작일 (AC-05-4), 다중 오류', () => {
  assert.deepEqual(validateTodo({ ...todo, startDate: '2026-10-02', endDate: '2026-10-01' }), { endDate: END })
  assert.deepEqual(validateTodo({ ...todo, title: '', startDate: '2026-10-02', endDate: '2026-10-01' }), {
    title: TITLE, endDate: END,
  })
})
