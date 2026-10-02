import { useLang } from '../hooks/useLang'
import Button from '../components/Button'

// 앱은 URL 라우팅 없이 '/' 하나만 쓴다. 그 외 경로로 들어오면 이 화면을 보여준다
export default function NotFoundPage() {
  const { t } = useLang()
  if (import.meta.env?.DEV) console.error('404 not found:', window.location.pathname)
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16 text-center">
      <h1 className="text-lg font-bold mb-2">{t('notFound.title')}</h1>
      <p role="alert" className="text-sm text-fg-muted mb-6">{t('notFound.message')}</p>
      <Button variant="primary" onClick={() => window.location.replace('/')}>
        {t('notFound.home')}
      </Button>
    </div>
  )
}
