import Button from '../components/Button'
import CategoryRow from '../components/CategoryRow'
import ConfirmDialog from '../components/ConfirmDialog'
import Header from '../components/Header'
import Input from '../components/Input'
import { useCategories, useCategoryManager } from '../hooks/useCategories'
import { useNavigation } from '../hooks/useNavigation'
import { useLang } from '../hooks/useLang'

export default function CategoryPage() {
  const { goMain } = useNavigation()
  const { categories, isCategoriesLoading, categoriesError } = useCategories()
  const m = useCategoryManager()
  const { t, te } = useLang()
  const alert = categoriesError ?? m.deleteError
  return (
    <>
      <Header />
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <Button onClick={goMain}>{t('common.backToMain')}</Button>
        <h1 className="text-lg font-bold">{t('category.title')}</h1>
      </div>
      {alert && (
        <p role="alert" className="px-4 py-2 text-sm text-danger bg-danger/10 border-b border-line">
          {te(alert)}
        </p>
      )}
      <form onSubmit={m.submitCreate} noValidate className="flex items-start gap-2 px-4 py-4 border-b border-line">
        <Input
          label={t('category.new')}
          className="flex-1"
          value={m.newName}
          onChange={(e) => m.setNewName(e.target.value)}
          error={m.createError ?? undefined}
        />
        <Button type="submit" className="mt-6" disabled={m.isCreating}>
          {t('category.add')}
        </Button>
      </form>
      {isCategoriesLoading ? (
        <p className="py-16 text-center text-sm text-fg-muted">{t('common.loading')}</p>
      ) : (
        <ul>
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} m={m} />
          ))}
        </ul>
      )}
      {m.deleting && (
        <ConfirmDialog
          title={t('category.deleteTitle')}
          message={[t('category.deleteConfirm', { name: m.deleting.name }), t('category.deleteNote')]}
          onConfirm={m.confirmDelete}
          onCancel={m.cancelDelete}
          isPending={m.isDeleting}
        />
      )}
    </>
  )
}
