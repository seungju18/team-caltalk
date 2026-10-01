import { existsSync } from 'node:fs'

// .env가 있을 때만 로드한다. 이미 설정된 실제 환경 변수가 우선한다. 운영은 .env 없이 동작.
const envFile = new URL('../.env', import.meta.url)
if (existsSync(envFile)) process.loadEnvFile(envFile)

const REQUIRED = ['DATABASE_URL', 'PORT', 'NODE_ENV', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']
const missing = REQUIRED.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`필수 환경 변수 누락: ${missing.join(', ')}`)
  process.exit(1)
}

const { DATABASE_URL, PORT, NODE_ENV, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = process.env as Record<string, string>

// 쿠키 Secure 판정에 쓰므로 오타를 막는다
if (NODE_ENV !== 'development' && NODE_ENV !== 'production') {
  console.error(`NODE_ENV는 development 또는 production이어야 한다: ${NODE_ENV}`)
  process.exit(1)
}

// PRD 6.4: Refresh 서명 키는 Access와 달라야 한다
if (JWT_ACCESS_SECRET === JWT_REFRESH_SECRET) {
  console.error('JWT_ACCESS_SECRET과 JWT_REFRESH_SECRET은 서로 달라야 한다')
  process.exit(1)
}

export const config = {
  databaseUrl: DATABASE_URL,
  port: Number(PORT),
  isProduction: NODE_ENV === 'production',
  jwtAccessSecret: JWT_ACCESS_SECRET,
  jwtRefreshSecret: JWT_REFRESH_SECRET,
  // 선택. 쉼표로 구분한 허용 출처. 비우면 같은 출처만 (PRD 7.2)
  corsOrigins: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? [],
}

export const BCRYPT_COST = 10 // NFR-07
export const DB_POOL_MAX = 20 // NFR-05
export const BODY_LIMIT = '100kb' // NFR-10
export const ACCESS_TOKEN_TTL_SEC = 15 * 60 // PRD 6.4, OI-03
export const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60 // PRD 6.4, OI-03
