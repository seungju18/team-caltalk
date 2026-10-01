import { Router } from 'express'
import { parseId } from '../validators/categoryValidator.ts'
import {
  validateCalendarQuery,
  validateTodoCreate,
  validateTodoListQuery,
  validateTodoUpdate,
} from '../validators/todoValidator.ts'
import { createTodo, deleteTodo, listCalendarTodos, listTodos, updateTodo } from '../services/todoService.ts'

export const todoRoutes = Router()

todoRoutes.get('/', async (req, res) => {
  res.json(await listTodos(req.userId, validateTodoListQuery(req.query)))
})

// '/:id'보다 먼저 정의한다
todoRoutes.get('/calendar', async (req, res) => {
  res.json(await listCalendarTodos(req.userId, validateCalendarQuery(req.query)))
})

todoRoutes.post('/', async (req, res) => {
  res.status(201).json(await createTodo(req.userId, validateTodoCreate(req.body)))
})

todoRoutes.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  res.json(await updateTodo(req.userId, id, validateTodoUpdate(req.body)))
})

todoRoutes.delete('/:id', async (req, res) => {
  await deleteTodo(req.userId, parseId(req.params.id))
  res.status(204).end()
})
