import { create } from 'zustand'
import { addMonths, today } from '../lib/date.ts'
import type { Todo, TodoFilter } from '../api/todos.ts'

export type Page = 'login' | 'signup' | 'main' | 'category' | 'profile'
export type Tab = 'list' | 'calendar'
export type Theme = 'light' | 'dark'
export type Modal = null | { mode: 'create' } | { mode: 'edit'; todo: Todo }

export function readTheme(): Theme {
  try {
    return globalThis.localStorage?.getItem('theme') === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

type UiState = {
  page: Page
  notice: string | null
  tab: Tab
  filter: TodoFilter
  categoryId: number | null
  calendarMonth: string
  modal: Modal
  theme: Theme
  setPage(page: Page, notice?: string): void
  setTab(tab: Tab): void
  setFilter(f: TodoFilter): void
  setCategoryFilter(id: number | null): void
  moveMonth(delta: number): void
  openModal(m: Exclude<Modal, null>): void
  closeModal(): void
  toggleTheme(): void
  reset(): void
}

// theme 을 뺀 초기값. reset 때마다 이번 달을 다시 계산한다
const initial = () => ({
  page: 'login' as Page,
  notice: null,
  tab: 'list' as Tab,
  filter: 'all' as TodoFilter,
  categoryId: null,
  calendarMonth: today().slice(0, 7),
  modal: null as Modal,
})

export const useUiStore = create<UiState>()((set, get) => ({
  ...initial(),
  theme: readTheme(),
  setPage: (page, notice) => set({ page, notice: notice ?? null }),
  setTab: (tab) => set({ tab }),
  setFilter: (filter) => set({ filter, categoryId: null }),
  setCategoryFilter: (categoryId) => set({ categoryId, filter: 'all' }),
  moveMonth: (delta) => set({ calendarMonth: addMonths(get().calendarMonth, delta) }),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: next })
    globalThis.document?.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('theme', next)
    } catch {
      // 저장 불가 환경이면 이번 접속에만 적용
    }
  },
  reset: () => set(initial()),
}))
