import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/users'
import { useNavigation } from './useNavigation'
import { useLogout } from './useAuth'
import { useLang } from './useLang'

export function useHeader() {
  const { theme, toggleTheme, goMain, goCategory, goProfile } = useNavigation()
  const { logout, isLoggingOut } = useLogout()
  const { toggleLang } = useLang()
  const { data } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const [isMenuOpen, setMenuOpen] = useState(false)
  // 모바일 메뉴에서 이동하면 메뉴를 닫는다
  const close = (fn: () => void) => () => {
    setMenuOpen(false)
    fn()
  }
  return {
    name: data?.name ?? '',
    theme,
    toggleTheme,
    toggleLang,
    goMain: close(goMain),
    goCategory: close(goCategory),
    goProfile: close(goProfile),
    logout,
    isLoggingOut,
    isMenuOpen,
    toggleMenu: () => setMenuOpen((v) => !v),
  }
}
