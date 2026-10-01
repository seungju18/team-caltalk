import type { RequestHandler } from 'express'
import { HttpError } from '../errors.ts'

// NFR-11: IP별 1분 창에서 로그인 실패 10회 초과 시 거부
const WINDOW_MS = 60 * 1000
const MAX_FAILURES = 10

// ponytail: 프로세스 메모리 카운터. 다중 인스턴스면 Redis 등 공유 저장소로 옮긴다
const failures = new Map<string, { count: number; windowStart: number }>()

export function resetLoginLimit() {
  failures.clear()
}

export const loginLimit: RequestHandler = (req, res, next) => {
  const ip = req.ip ?? ''
  const now = Date.now()
  let entry = failures.get(ip)
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    entry = { count: 0, windowStart: now }
    failures.set(ip, entry)
  }
  if (entry.count >= MAX_FAILURES) {
    throw new HttpError(429, '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요')
  }
  const current = entry
  res.on('finish', () => {
    if (res.statusCode === 401) current.count += 1
  })
  next()
}
