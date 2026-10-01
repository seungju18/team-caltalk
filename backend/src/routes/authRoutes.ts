import { Router } from 'express'
import type { Response } from 'express'
import { config, REFRESH_TOKEN_TTL_SEC } from '../config.ts'
import { loginLimit } from '../middleware/loginLimit.ts'
import { validateLogin, validateSignup } from '../validators/authValidator.ts'
import * as authService from '../services/authService.ts'

export const authRoutes = Router()

const COOKIE_NAME = 'refreshToken'
const COOKIE_PATH = '/api/auth'

// PRD 6.4: Refresh 쿠키 속성 (로그인·재발급·비밀번호 변경 공용)
export function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProduction,
    path: COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_SEC * 1000,
  })
}

authRoutes.post('/signup', async (req, res) => {
  const user = await authService.signup(validateSignup(req.body))
  res.status(201).json(user)
})

authRoutes.post('/login', loginLimit, async (req, res) => {
  const { email, password } = validateLogin(req.body)
  const { accessToken, refreshToken } = await authService.login(email, password)
  setRefreshCookie(res, refreshToken)
  res.json({ accessToken })
})

authRoutes.post('/refresh', async (req, res) => {
  const { accessToken, refreshToken } = await authService.refresh(req.cookies?.[COOKIE_NAME])
  setRefreshCookie(res, refreshToken)
  res.json({ accessToken })
})

authRoutes.post('/logout', async (req, res) => {
  await authService.logout(req.cookies?.[COOKIE_NAME])
  res.clearCookie(COOKIE_NAME, { path: COOKIE_PATH, httpOnly: true, sameSite: 'strict', secure: config.isProduction })
  res.status(204).end()
})
