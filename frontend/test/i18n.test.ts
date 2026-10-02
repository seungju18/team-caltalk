import { test } from 'node:test'
import assert from 'node:assert/strict'
import ko from '../src/locales/ko.ts'
import en, { koToEn } from '../src/locales/en.ts'
import { tr } from '../src/i18n.ts'

// 키 경로 목록 (값이 객체면 재귀)
const keys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))

// lib/validation.ts·hooks·api/client.ts 문구와 backend 사용자 노출 오류 문구
const MESSAGES = [
  '비밀번호는 8~64자여야 합니다',
  '비밀번호는 영문과 숫자를 각각 1자 이상 포함해야 합니다',
  '이름은 1~30자여야 합니다',
  '카테고리 이름은 1~20자여야 합니다',
  '이메일 형식이 올바르지 않습니다 (최대 254자)',
  '제목은 1~100자여야 합니다',
  '설명은 최대 1000자입니다',
  '날짜를 입력하세요',
  '종료일자는 시작일자보다 빠를 수 없습니다',
  '이메일을 입력하세요',
  '비밀번호를 입력하세요',
  '현재 비밀번호를 입력하세요',
  '카테고리가 올바르지 않습니다',
  '날짜 형식(YYYY-MM-DD)이 올바르지 않습니다',
  '완료 여부는 true 또는 false여야 합니다',
  '수정할 항목이 없습니다',
  '허용되지 않는 필터입니다',
  '카테고리 필터와 상태 필터는 함께 쓸 수 없습니다',
  '월 형식(YYYY-MM)이 올바르지 않습니다',
  '이미 사용 중인 이메일입니다',
  '식별자 또는 비밀번호가 올바르지 않습니다',
  '이미 있는 카테고리 이름입니다',
  "'기본' 카테고리는 변경할 수 없습니다",
  "'기본' 카테고리는 삭제할 수 없습니다",
  '본인 카테고리만 지정할 수 있습니다',
  '현재 비밀번호가 올바르지 않습니다',
  '입력값을 확인하세요',
  '인증이 필요합니다',
  '찾을 수 없습니다',
  '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요',
  '요청 본문이 너무 큽니다',
  '요청 형식이 올바르지 않습니다',
  '서버 오류가 발생했습니다',
  'Google 인증 정보가 필요합니다',
  'Google 인증에 실패했습니다',
  '가입된 계정이 없습니다. 먼저 회원가입하세요',
  '요청을 처리하지 못했습니다',
  '서버에 연결할 수 없습니다',
  '삭제하지 못했습니다',
  '저장되었습니다',
  '변경되었습니다. 다른 기기는 로그아웃됩니다',
  '가입이 완료되었습니다. 로그인하세요',
]

test('ko.ts 와 en.ts 의 키 구조가 같다', () => {
  assert.deepEqual(keys(en), keys(ko))
})

test('서버·화면 문구가 모두 영어 대응표에 있다', () => {
  assert.deepEqual(MESSAGES.filter((m) => !koToEn[m]), [])
})

test('tr: en 은 대응표로 번역, 없으면 원문 / ko 는 원문', () => {
  assert.equal(tr('찾을 수 없습니다', 'en'), 'Not found')
  assert.equal(tr('대응표에 없는 문구', 'en'), '대응표에 없는 문구')
  assert.equal(tr('찾을 수 없습니다', 'ko'), '찾을 수 없습니다')
})
