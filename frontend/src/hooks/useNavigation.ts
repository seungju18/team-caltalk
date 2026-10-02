import { useUiStore } from '../stores/uiStore'
import type { Todo } from '../api/todos'

// 화면 전환·탭·모달·테마. category/profile 이동 시 tab 을 건드리지 않아 직전 탭이 유지된다
export function useNavigation() {
  const s = useUiStore()
  return {
    page: s.page,
    notice: s.notice,
    tab: s.tab,
    setTab: s.setTab,
    goMain: () => s.setPage('main'),
    goCategory: () => s.setPage('category'),
    goProfile: () => s.setPage('profile'),
    goLogin: () => s.setPage('login'),
    goSignup: () => s.setPage('signup'),
    modal: s.modal,
    openCreate: () => s.openModal({ mode: 'create' }),
    openEdit: (todo: Todo) => s.openModal({ mode: 'edit', todo }),
    closeModal: s.closeModal,
    theme: s.theme,
    toggleTheme: s.toggleTheme,
  }
}
