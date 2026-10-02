import Input from './Input'
import type { useTodoForm } from '../hooks/useTodoForm'
import { useLang } from '../hooks/useLang'

const FIELD =
  'w-full px-3 rounded-sm bg-bg border text-fg placeholder:text-fg-subtle focus:border-primary text-base md:text-sm focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2'
const border = (error?: string) => (error ? 'border-danger' : 'border-line-strong')

// 입력란만. 제출·버튼은 TodoModal
export default function TodoForm({ f }: { f: ReturnType<typeof useTodoForm> }) {
  const { values, setField, errors } = f
  const { t, te } = useLang()
  return (
    <div className="flex flex-col gap-4">
      <Input label={`${t('todo.title')} *`} value={values.title} onChange={(e) => setField('title', e.target.value)} error={errors.title} />
      <label className="block">
        <span className="block text-sm text-fg-muted mb-1">{t('todo.description')}</span>
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
          aria-invalid={errors.description ? true : undefined}
          className={`${FIELD} py-2 ${border(errors.description)}`}
        />
        {errors.description && <span className="block text-xs text-danger mt-1">{te(errors.description)}</span>}
      </label>
      <label className="block">
        <span className="block text-sm text-fg-muted mb-1">{t('todo.category')}</span>
        <select
          value={values.categoryId}
          onChange={(e) => setField('categoryId', e.target.value)}
          disabled={f.isCategoriesLoading}
          aria-invalid={errors.categoryId ? true : undefined}
          className={`${FIELD} h-9 disabled:opacity-40 ${border(errors.categoryId)}`}
        >
          <option value="">{t('todo.noCategory')}</option>
          {f.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <span className="block text-xs text-danger mt-1">{te(errors.categoryId)}</span>}
      </label>
      <div className="grid md:grid-cols-2 gap-2">
        <Input
          label={`${t('todo.startDate')} *`}
          type="date"
          value={values.startDate}
          onChange={(e) => setField('startDate', e.target.value)}
          error={errors.startDate}
        />
        <Input
          label={`${t('todo.endDate')} *`}
          type="date"
          value={values.endDate}
          onChange={(e) => setField('endDate', e.target.value)}
          error={errors.endDate}
        />
      </div>
      {f.isEdit && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isCompleted}
            onChange={(e) => setField('isCompleted', e.target.checked)}
            className="size-4 rounded-sm accent-primary"
          />
          {t('todo.completed')}
        </label>
      )}
    </div>
  )
}
