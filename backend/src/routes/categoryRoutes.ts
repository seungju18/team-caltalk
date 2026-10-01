import { Router } from 'express'
import { parseId, validateCategoryInput } from '../validators/categoryValidator.ts'
import { createCategory, deleteCategory, listCategories, renameCategory } from '../services/categoryService.ts'

export const categoryRoutes = Router()

categoryRoutes.get('/', async (req, res) => {
  res.json(await listCategories(req.userId))
})

categoryRoutes.post('/', async (req, res) => {
  const name = validateCategoryInput(req.body)
  res.status(201).json(await createCategory(req.userId, name))
})

categoryRoutes.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  const name = validateCategoryInput(req.body)
  res.json(await renameCategory(req.userId, id, name))
})

categoryRoutes.delete('/:id', async (req, res) => {
  await deleteCategory(req.userId, parseId(req.params.id))
  res.status(204).end()
})
