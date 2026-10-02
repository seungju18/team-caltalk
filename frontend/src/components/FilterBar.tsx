import { FILTER_LABELS, type TodoFilter } from '../api/todos'
import type { Category } from '../api/categories'
import { useLang } from '../hooks/useLang'

type Props = {
  filter: TodoFilter
  categoryId: number | null
  categories: Category[]
  onFilter(f: TodoFilter): void
  onCategory(id: number | null): void
}

const FILTERS = Object.keys(FILTER_LABELS) as TodoFilter[]

// 상태 칩과 카테고리는 단일 선택. 카테고리를 고르면 상태 칩은 선택 해제로 보인다
export default function FilterBar({ filter, categoryId, categories, onFilter, onCategory }: Props) {
  const { t } = useLang()
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-line">
      <div className="inline-flex flex-wrap border border-line-strong rounded-sm overflow-hidden">
        {FILTERS.map((f) => {
          const selected = categoryId === null && filter === f
          return (
            <button
              key={f}
              type="button"
              aria-pressed={selected}
              onClick={() => onFilter(f)}
              className={`h-9 px-3 text-sm border-l border-line-strong first:border-l-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2 ${selected ? 'bg-primary text-white' : 'bg-surface text-fg hover:bg-surface-hover'}`}
            >
              {t(`status.${f}`)}
            </button>
          )
        })}
      </div>
      <select
        aria-label={t('main.categoryFilter')}
        value={categoryId ?? ''}
        onChange={(e) => onCategory(e.target.value === '' ? null : Number(e.target.value))}
        className="h-9 w-auto px-3 rounded-sm bg-bg border border-line-strong text-fg focus:border-primary text-base md:text-sm focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      >
        <option value="">{t('main.categoryAll')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
