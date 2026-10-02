import Button from '../components/Button'
import Header from '../components/Header'
import Input from '../components/Input'
import { useNavigation } from '../hooks/useNavigation'
import { useProfile } from '../hooks/useProfile'
import { useLang } from '../hooks/useLang'

const NOTICE = 'text-sm text-success'
const ALERT = 'text-xs text-danger'

export default function ProfilePage() {
  const { goMain } = useNavigation()
  const p = useProfile()
  const { t, te } = useLang()
  return (
    <>
      <Header />
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <Button onClick={goMain}>{t('common.backToMain')}</Button>
        <h1 className="text-lg font-bold">{t('profile.title')}</h1>
      </div>
      <div className="px-4">
        <section className="py-4 border-b border-line">
          <h2 className="text-sm font-bold mb-3">{t('profile.basic')}</h2>
          <form onSubmit={p.submitName} noValidate className="flex flex-col gap-3 max-w-sm">
            <div>
              <p className="text-sm text-fg-muted mb-1">{t('field.email')}</p>
              <p className="text-sm text-fg break-all">
                {p.email} <span className="text-xs text-fg-muted">{t('profile.readOnly')}</span>
              </p>
            </div>
            <Input
              label={`${t('field.name')} *`}
              autoComplete="name"
              value={p.name}
              onChange={(e) => p.setName(e.target.value)}
              error={p.nameErrors.name}
            />
            {p.nameErrors.form && <p role="alert" className={ALERT}>{te(p.nameErrors.form)}</p>}
            {p.nameNotice && <p role="status" className={NOTICE}>{te(p.nameNotice)}</p>}
            <Button variant="primary" type="submit" className="self-start" disabled={p.isSavingName}>
              {p.isSavingName ? t('common.saving') : t('profile.saveName')}
            </Button>
          </form>
        </section>
        <section className="py-4 border-b border-line">
          <h2 className="text-sm font-bold mb-3">{t('profile.changePassword')}</h2>
          <form onSubmit={p.submitPassword} noValidate className="flex flex-col gap-3 max-w-sm">
            <Input
              label={`${t('profile.currentPassword')} *`}
              type="password"
              autoComplete="current-password"
              value={p.currentPassword}
              onChange={(e) => p.setCurrentPassword(e.target.value)}
              error={p.passwordErrors.currentPassword}
            />
            <Input
              label={`${t('profile.newPassword')} *`}
              type="password"
              autoComplete="new-password"
              value={p.newPassword}
              onChange={(e) => p.setNewPassword(e.target.value)}
              error={p.passwordErrors.newPassword}
              hint={t('common.passwordHint')}
            />
            {p.passwordErrors.form && <p role="alert" className={ALERT}>{te(p.passwordErrors.form)}</p>}
            {p.passwordNotice && <p role="status" className={NOTICE}>{te(p.passwordNotice)}</p>}
            <Button variant="primary" type="submit" className="self-start" disabled={p.isChangingPassword}>
              {p.isChangingPassword ? t('profile.changing') : t('profile.changePassword')}
            </Button>
          </form>
        </section>
      </div>
    </>
  )
}
