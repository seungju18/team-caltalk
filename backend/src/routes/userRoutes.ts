import { Router } from 'express'
import { validateNameUpdate, validatePasswordChange } from '../validators/authValidator.ts'
import * as userService from '../services/userService.ts'
import { setRefreshCookie } from './authRoutes.ts'

export const userRoutes = Router()

userRoutes.get('/me', async (req, res) => {
  res.json(await userService.getMe(req.userId))
})

userRoutes.patch('/me', async (req, res) => {
  const { name } = validateNameUpdate(req.body)
  res.json(await userService.updateName(req.userId, name))
})

userRoutes.put('/me/password', async (req, res) => {
  const { currentPassword, newPassword } = validatePasswordChange(req.body)
  const { accessToken, refreshToken } = await userService.changePassword(req.userId, currentPassword, newPassword)
  setRefreshCookie(res, refreshToken)
  res.json({ accessToken })
})
