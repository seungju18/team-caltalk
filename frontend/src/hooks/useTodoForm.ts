import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { parseApiError } from '../api/client'
import { useUiStore } from '../stores/uiStore'
import { today } from '../lib/date'
import { validateTodo, type FieldErrors } from '../lib/validation'
import { useTodoMutations } from './useTodoMutations'
import { useCategories } from './useCategories'
import { tr } from '../i18n'

export type TodoFormValues = {
  title: string
  description: string
  categoryId: string // '' = 선택 안 함 (기본 적용)
  startDate: string
  endDate: string
  isCompleted: boolean
}

// 등록·편집 공용 모달 폼. 편집은 modal.todo 로 채운다 (WF-05)
export function useTodoForm() {
  const modal = useUiStore((s) => s.modal)
  const closeModal = useUiStore((s) => s.closeModal)
  const todo = modal?.mode === 'edit' ? modal.todo : null
  const [values, setValues] = useState<TodoFormValues>(() =>
    todo
      ? {
          title: todo.title,
          description: todo.description ?? '',
          categoryId: String(todo.categoryId),
          startDate: todo.startDate,
          endDate: todo.endDate,
          isCompleted: todo.isCompleted,
        }
      : { title: '', description: '', categoryId: '', startDate: today(), endDate: today(), isCompleted: false },
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isConfirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const m = useTodoMutations()
  const { categories, isCategoriesLoading } = useCategories()
  const qc = useQueryClient()

  // 404(남의 할일·이미 없음): 안내 후 닫고 목록 다시 로드. 처리했으면 null
  const handleError = (e: unknown) => {
    const err = parseApiError(e)
    if (err.status !== 404) return err
    window.alert(tr('찾을 수 없습니다'))
    qc.invalidateQueries({ queryKey: ['todos'] })
    closeModal()
    return null
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validateTodo(values)
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return
    const body = {
      title: values.title.trim(),
      description: values.description === '' ? null : values.description,
      categoryId: values.categoryId === '' ? null : Number(values.categoryId),
      startDate: values.startDate,
      endDate: values.endDate,
    }
    try {
      if (todo) await m.updateTodo(todo.id, { ...body, isCompleted: values.isCompleted })
      else await m.createTodo(body)
      closeModal()
    } catch (err) {
      const r = handleError(err)
      if (!r) return
      setErrors(r.fields)
      setFormError(Object.keys(r.fields).length > 0 ? null : r.message)
    }
  }

  const confirmDelete = async () => {
    if (!todo) return
    try {
      await m.deleteTodo(todo.id)
      closeModal()
    } catch (err) {
      const r = handleError(err)
      if (r) setDeleteError(r.message)
    }
  }

  return {
    isEdit: todo !== null,
    originalTitle: todo?.title ?? '',
    values,
    setField: <K extends keyof TodoFormValues>(k: K, v: TodoFormValues[K]) => setValues((p) => ({ ...p, [k]: v })),
    errors,
    formError,
    submit,
    isSaving: m.isCreating || m.isUpdating,
    categories,
    isCategoriesLoading,
    close: closeModal,
    isConfirmingDelete,
    askDelete: () => {
      setConfirmingDelete(true)
      setDeleteError(null)
    },
    cancelDelete: () => setConfirmingDelete(false),
    confirmDelete,
    isDeleting: m.isDeleting,
    deleteError,
  }
}
