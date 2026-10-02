import Button from '../components/Button'
import Input from '../components/Input'
import { useLogin } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'
import { useLang } from '../hooks/useLang'

export default function LoginPage() {
  const { email, setEmail, password, setPassword, submit, isLoggingIn, loginError, notice, googleRef, hasGoogle } =
    useLogin()
  const { goSignup } = useNavigation()
  const { t, te } = useLang()
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-lg font-bold mb-6">{t('login.title')}</h1>
      {notice && <p className="text-sm text-success mb-4">{te(notice)}</p>}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label={t('field.email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label={t('field.password')}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {loginError && (
          <p role="alert" className="text-xs text-danger">
            {te(loginError)}
          </p>
        )}
        <Button variant="primary" type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? t('login.submitting') : t('login.title')}
        </Button>
      </form>
      {hasGoogle && (
        <>
          <div className="flex items-center gap-2 my-4 text-xs text-fg-muted">
            <span className="flex-1 border-t border-line" />
            {t('login.or')}
            <span className="flex-1 border-t border-line" />
          </div>
          <div ref={googleRef} className="w-full" />
        </>
      )}
      <p className="text-sm text-fg-muted mt-6">
        {t('login.noAccount')}{' '}
        <button type="button" onClick={goSignup} className="text-primary-fg">
          {t('login.signup')}
        </button>
      </p>
    </div>
  )
}
