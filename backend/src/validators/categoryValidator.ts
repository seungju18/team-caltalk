import { NotFoundError, ValidationError } from '../errors.ts'

export const CATEGORY_NAME_MAX = 20 // 도메인 3.2

// 경로 :id는 양의 정수만 허용한다. 아니면 존재하지 않는 리소스로 본다 (404)
export function parseId(value: string | undefined): number {
  const id = Number(value)
  if (!/^[1-9]\d*$/.test(value ?? '') || !Number.isSafeInteger(id)) throw new NotFoundError()
  return id
}

// 이름: 앞뒤 공백 제거 후 1~20자 (BR-11)
export function validateCategoryInput(body: unknown): string {
  const raw = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).name : undefined
  const name = typeof raw === 'string' ? raw.trim() : ''
  const length = [...name].length
  if (length < 1 || length > CATEGORY_NAME_MAX) {
    throw new ValidationError([{ field: 'name', reason: `카테고리 이름은 1~${CATEGORY_NAME_MAX}자여야 합니다` }])
  }
  return name
}
