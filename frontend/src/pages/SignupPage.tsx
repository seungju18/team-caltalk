import Button from '../components/Button'
import Input from '../components/Input'
import { useSignup } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'
import { useLang } from '../hooks/useLang'

export default function SignupPage() {
  const { values, setField, submit, isSigningUp, errors, formError } = useSignup()
  const { goLogin } = useNavigation()
  const { t, te } = useLang()
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-lg font-bold mb-6">{t('signup.title')}</h1>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Input
          label={`${t('field.email')} *`}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label={`${t('field.password')} *`}
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => setField('password', e.target.value)}
          error={errors.password}
          hint={t('common.passwordHint')}
        />
        <Input
          label={`${t('field.name')} *`}
          autoComplete="name"
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          error={errors.name}
        />
        {formError && (
          <p role="alert" className="text-xs text-danger">
            {te(formError)}
          </p>
        )}
        <Button variant="primary" type="submit" className="w-full" disabled={isSigningUp}>
          {isSigningUp ? t('signup.submitting') : t('signup.submit')}
        </Button>
      </form>
      <p className="text-sm text-fg-muted mt-6">
        {t('signup.hasAccount')}{' '}
        <button type="button" onClick={goLogin} className="text-primary-fg">
          {t('signup.login')}
        </button>
      </p>
    </div>
  )
}
