import { useRestoreSession } from './hooks/useAuth'
import { useNavigation } from './hooks/useNavigation'
import { useLang } from './hooks/useLang'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import MainPage from './pages/MainPage'
import CategoryPage from './pages/CategoryPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

const PAGES = {
  login: LoginPage,
  signup: SignupPage,
  main: MainPage,
  category: CategoryPage,
  profile: ProfilePage,
}

export default function App() {
  const { isRestoring } = useRestoreSession()
  const { page, theme } = useNavigation()
  const { t } = useLang()
  const Page = window.location.pathname === '/' ? PAGES[page] : NotFoundPage
  return (
    <div className={`min-h-screen bg-bg text-fg ${theme === 'dark' ? '[color-scheme:dark]' : '[color-scheme:light]'}`}>
      {isRestoring ? <p className="py-16 text-center text-sm text-fg-muted">{t('common.loading')}</p> : <Page />}
    </div>
  )
}
