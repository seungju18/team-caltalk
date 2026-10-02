import Button from './Button'
import Input from './Input'
import type { Category } from '../api/categories'
import type { useCategoryManager } from '../hooks/useCategories'
import { useLang } from '../hooks/useLang'

type Props = { category: Category; m: ReturnType<typeof useCategoryManager> }

export default function CategoryRow({ category, m }: Props) {
  const { t } = useLang()
  if (m.editing?.id === category.id) {
    return (
      <li className="px-4 py-3 border-b border-line">
        <form onSubmit={m.submitEdit} noValidate className="flex items-start gap-2">
          <Input
            label={t('category.rename')}
            className="flex-1"
            value={m.editing.name}
            onChange={(e) => m.setEditName(e.target.value)}
            error={m.editError ?? undefined}
            autoFocus
          />
          <Button type="submit" className="mt-6" disabled={m.isRenaming}>
            {t('common.save')}
          </Button>
          <Button className="mt-6" onClick={m.cancelEdit} disabled={m.isRenaming}>
            {t('common.cancel')}
          </Button>
        </form>
      </li>
    )
  }
  return (
    <li className="flex items-center gap-3 px-4 py-3 border-b border-line">
      <span className="flex-1 min-w-0 truncate text-sm">{category.name}</span>
      {category.isDefault ? (
        <span className="text-xs text-fg-muted">{t('category.locked')}</span>
      ) : (
        <>
          <Button onClick={() => m.startEdit(category)}>{t('category.rename')}</Button>
          <Button variant="danger" onClick={() => m.askDelete(category)}>
            {t('common.delete')}
          </Button>
        </>
      )}
    </li>
  )
}
