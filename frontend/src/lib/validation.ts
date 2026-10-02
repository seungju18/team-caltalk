// 문구는 서버(backend) 사유와 같게 둔다
export type FieldErrors = Partial<Record<string, string>>

const len = (s: string) => [...s].length

export function validatePassword(v: string): string | null {
  if (v.length < 8 || v.length > 64) return '비밀번호는 8~64자여야 합니다'
  if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return '비밀번호는 영문과 숫자를 각각 1자 이상 포함해야 합니다'
  return null
}

export function validateName(v: string): string | null {
  const n = len(v.trim())
  return n < 1 || n > 30 ? '이름은 1~30자여야 합니다' : null
}

export function validateCategoryName(v: string): string | null {
  const n = len(v.trim())
  return n < 1 || n > 20 ? '카테고리 이름은 1~20자여야 합니다' : null
}

export function validateSignup(v: { email: string; password: string; name: string }): FieldErrors {
  const errors: FieldErrors = {}
  const email = v.email.trim()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '이메일 형식이 올바르지 않습니다 (최대 254자)'
  }
  const password = validatePassword(v.password)
  if (password) errors.password = password
  const name = validateName(v.name)
  if (name) errors.name = name
  return errors
}

export function validateTodo(v: { title: string; description: string; startDate: string; endDate: string }): FieldErrors {
  const errors: FieldErrors = {}
  const title = len(v.title.trim())
  if (title < 1 || title > 100) errors.title = '제목은 1~100자여야 합니다'
  if (len(v.description) > 1000) errors.description = '설명은 최대 1000자입니다'
  if (!v.startDate) errors.startDate = '날짜를 입력하세요'
  if (!v.endDate) errors.endDate = '날짜를 입력하세요'
  // BR-08: 같은 날·과거 날짜는 허용
  if (v.startDate && v.endDate && v.endDate < v.startDate) {
    errors.endDate = '종료일자는 시작일자보다 빠를 수 없습니다'
  }
  return errors
}
