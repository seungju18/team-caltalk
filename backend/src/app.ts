import express from 'express'
import type { ErrorRequestHandler } from 'express'
import cookieParser from 'cookie-parser'
import { BODY_LIMIT, config } from './config.ts'
import { HttpError, ValidationError } from './errors.ts'
import { requireAuth } from './middleware/auth.ts'
import { healthRoutes } from './routes/healthRoutes.ts'
import { authRoutes } from './routes/authRoutes.ts'
import { userRoutes } from './routes/userRoutes.ts'
import { categoryRoutes } from './routes/categoryRoutes.ts'
import { todoRoutes } from './routes/todoRoutes.ts'
import { docsRoutes } from './routes/docsRoutes.ts'

export const app = express()

// CORS: CORS_ORIGIN에 있는 출처만 허용. Refresh 쿠키 전송을 위해 credentials 허용
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (!origin || !config.corsOrigins.includes(origin)) return next()
  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  })
  if (req.method !== 'OPTIONS') return next()
  res.set({
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  })
  res.sendStatus(204)
})

app.use(express.json({ limit: BODY_LIMIT })) // NFR-10: 본문 크기 제한
app.use(cookieParser())

// BR-01: 인증 없이 열린 경로는 헬스체크와 /api/auth(가입·로그인·재발급·로그아웃)뿐이다 (예외: 개발 전용 /api-docs)
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', requireAuth, userRoutes)
app.use('/api/categories', requireAuth, categoryRoutes)
app.use('/api/todos', requireAuth, todoRoutes)

// API 문서는 개발 환경에서만 연다
if (!config.isProduction) app.use('/api-docs', docsRoutes)

// 최종 오류 핸들러. 요청 본문·헤더는 로그에 남기지 않는다.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json(
      err instanceof ValidationError ? { message: err.message, errors: err.errors } : { message: err.message },
    )
    return
  }
  // body-parser 오류: 본문 초과(413), JSON 파싱 실패(400)
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ message: '요청 본문이 너무 큽니다' })
    return
  }
  if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500 && err.type) {
    res.status(err.status).json({ message: '요청 형식이 올바르지 않습니다' })
    return
  }
  console.error(err)
  res.status(500).json({ message: '서버 오류가 발생했습니다' })
}
app.use(errorHandler)

// Vercel은 이 파일의 default export를 서버 함수로 사용한다
export default app
