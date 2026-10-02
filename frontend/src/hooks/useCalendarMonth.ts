import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listCalendarTodos, type Todo } from '../api/todos'
import { parseApiError } from '../api/client'
import { useUiStore } from '../stores/uiStore'
import { buildCalendarCells, monthLabel, monthLabelEn, today } from '../lib/date'
import { useLang } from './useLang'

// 캘린더 탭: 월 상태·이동·월 조회·그리드 (PRD 7.4). 월은 store 에 있어 탭을 오가도 유지된다
export function useCalendarMonth() {
  const month = useUiStore((s) => s.calendarMonth)
  const moveMonth = useUiStore((s) => s.moveMonth)
  const openModal = useUiStore((s) => s.openModal)
  const { lang } = useLang()
  const day = today()
  const q = useQuery({
    queryKey: ['todos', 'calendar', month, day],
    queryFn: () => listCalendarTodos(month, day),
  })
  const cells = useMemo(() => buildCalendarCells(month, q.data ?? [], day), [month, q.data, day])
  return {
    label: lang === 'en' ? monthLabelEn(month) : monthLabel(month),
    prevMonth: () => moveMonth(-1),
    nextMonth: () => moveMonth(1),
    cells,
    isCalendarLoading: q.isPending,
    calendarError: q.error ? parseApiError(q.error).message : null,
    openEdit: (todo: Todo) => openModal({ mode: 'edit', todo }),
  }
}
