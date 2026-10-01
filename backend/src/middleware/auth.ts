import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.ts'
import { UnauthorizedError } from '../errors.ts'

declare global {
  namespace Express {
    interface Request {
      userId: number // Access Token의 sub. 사용자 ID는 여기서만 얻는다 (NFR-09)
    }
  }
}

// BR-01, PRD 6.4: HS256 고정, type = "access" 확인. 없음·만료·위조는 401
export const requireAuth: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? []
  if (scheme !== 'Bearer' || !token) throw new UnauthorizedError()
  try {
    const payload = jwt.verify(token, config.jwtAccessSecret, { algorithms: ['HS256'] })
    if (typeof payload === 'string' || payload.type !== 'access') throw new UnauthorizedError()
    req.userId = Number(payload.sub)
  } catch {
    throw new UnauthorizedError()
  }
  next()
}
