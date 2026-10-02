import { ValidationError } from '../errors.ts'

type FieldError = { field: string; reason: string }

// 도메인 3장 제약 수치
const EMAIL_MAX = 254
const PASSWORD_MIN = 8
const PASSWORD_MAX = 64
const NAME_MAX = 30
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function body(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
}

// 비밀번호는 trim 하지 않는다. 8~64자, 영문·숫자 각 1자 이상
function checkPassword(field: string, value: unknown, errors: FieldError[]): string {
  if (typeof value !== 'string' || value.length < PASSWORD_MIN || value.length > PASSWORD_MAX) {
    errors.push({ field, reason: `비밀번호는 ${PASSWORD_MIN}~${PASSWORD_MAX}자여야 합니다` })
    return ''
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    errors.push({ field, reason: '비밀번호는 영문과 숫자를 각각 1자 이상 포함해야 합니다' })
  }
  return value
}

// 이름은 앞뒤 공백 제거 후 1~30자
function checkName(value: unknown, errors: FieldError[]): string {
  const name = typeof value === 'string' ? value.trim() : ''
  if (name.length < 1 || name.length > NAME_MAX) {
    errors.push({ field: 'name', reason: `이름은 1~${NAME_MAX}자여야 합니다` })
  }
  return name
}

// BR-11: 위반 항목을 모두 모아 한 번에 400
export function validateSignup(input: unknown) {
  const b = body(input)
  const errors: FieldError[] = []
  const email = typeof b.email === 'string' ? b.email.trim() : ''
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    errors.push({ field: 'email', reason: `이메일 형식이 올바르지 않습니다 (최대 ${EMAIL_MAX}자)` })
  }
  const password = checkPassword('password', b.password, errors)
  const name = checkName(b.name, errors)
  if (errors.length > 0) throw new ValidationError(errors)
  return { email, password, name }
}

// 로그인은 형식(문자열 여부)만 본다. 규칙 위반은 인증 실패로 처리한다 (BR-14)
export function validateLogin(input: unknown) {
  const b = body(input)
  const errors: FieldError[] = []
  if (typeof b.email !== 'string') errors.push({ field: 'email', reason: '이메일을 입력하세요' })
  if (typeof b.password !== 'string') errors.push({ field: 'password', reason: '비밀번호를 입력하세요' })
  if (errors.length > 0) throw new ValidationError(errors)
  return { email: (b.email as string).trim(), password: b.password as string }
}

// Google 로그인: GIS가 준 ID 토큰(credential) 문자열만 본다
export function validateGoogleLogin(input: unknown) {
  const { credential } = body(input)
  if (typeof credential !== 'string' || credential === '') {
    throw new ValidationError([{ field: 'credential', reason: 'Google 인증 정보가 필요합니다' }])
  }
  return { credential }
}

// BR-16: email 필드는 읽지 않는다
export function validateNameUpdate(input: unknown) {
  const errors: FieldError[] = []
  const name = checkName(body(input).name, errors)
  if (errors.length > 0) throw new ValidationError(errors)
  return { name }
}

export function validatePasswordChange(input: unknown) {
  const b = body(input)
  const errors: FieldError[] = []
  if (typeof b.currentPassword !== 'string') {
    errors.push({ field: 'currentPassword', reason: '현재 비밀번호를 입력하세요' })
  }
  const newPassword = checkPassword('newPassword', b.newPassword, errors)
  if (errors.length > 0) throw new ValidationError(errors)
  return { currentPassword: b.currentPassword as string, newPassword }
}
