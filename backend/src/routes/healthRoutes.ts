import { Router } from 'express'
import { pool } from '../db.ts'

export const healthRoutes = Router()

// DB 연결까지 확인한다. 실패 시 Express 5가 async 오류를 오류 핸들러로 넘긴다.
healthRoutes.get('/', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok' })
})
