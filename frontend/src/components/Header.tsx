import Button from './Button'
import { useHeader } from '../hooks/useHeader'
import { useLang } from '../hooks/useLang'

export default function Header() {
  const h = useHeader()
  const { t } = useLang()
  const themeButtons = (
    <>
      <Button onClick={h.toggleTheme}>{h.theme === 'light' ? t('header.dark') : t('header.light')}</Button>
      <Button onClick={h.toggleLang}>{t('header.otherLang')}</Button>
    </>
  )
  const menu = (
    <>
      <Button onClick={h.goCategory}>{t('header.category')}</Button>
      <Button onClick={h.goProfile}>{t('header.profile')}</Button>
      <Button onClick={h.logout} disabled={h.isLoggingOut}>
        {t('header.logout')}
      </Button>
    </>
  )
  return (
    <header className="h-14 bg-surface border-b border-line flex items-center justify-between px-4">
      <button type="button" onClick={h.goMain} className="text-lg font-bold">
        team-caltalk
      </button>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm">{h.name}</span>
          {menu}
        </div>
        {themeButtons}
        <Button variant="icon" className="md:hidden" onClick={h.toggleMenu} aria-label={t('header.openMenu')}>
          ☰
        </Button>
      </div>
      {h.isMenuOpen && (
        <div className="fixed inset-0 bg-surface p-4 flex flex-col gap-2 md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">{h.name}</span>
            <Button variant="icon" onClick={h.toggleMenu} aria-label={t('header.closeMenu')}>
              ✕
            </Button>
          </div>
          {menu}
        </div>
      )}
    </header>
  )
}
