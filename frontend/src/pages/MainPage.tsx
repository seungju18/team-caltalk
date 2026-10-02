import Button from '../components/Button'
import CalendarGrid from '../components/CalendarGrid'
import Header from '../components/Header'
import TodoList from '../components/TodoList'
import TodoModal from '../components/TodoModal'
import { useNavigation } from '../hooks/useNavigation'
import { useLang } from '../hooks/useLang'
import type { Tab } from '../stores/uiStore'

const TABS: Tab[] = ['list', 'calendar']

export default function MainPage() {
  const { tab, setTab, openCreate, modal } = useNavigation()
  const { t } = useLang()
  return (
    <>
      <Header />
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-line">
        <div className="inline-flex border border-line-strong rounded-sm overflow-hidden">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
              className={`h-9 px-3 text-sm border-l border-line-strong first:border-l-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2 ${tab === id ? 'bg-primary text-white' : 'bg-surface text-fg hover:bg-surface-hover'}`}
            >
              {t(`main.${id}`)}
            </button>
          ))}
        </div>
        <Button variant="primary" className="md:ml-auto" onClick={openCreate}>
          {t('main.newTodo')}
        </Button>
      </div>
      {tab === 'list' ? <TodoList /> : <CalendarGrid />}
      {modal && <TodoModal key={modal.mode === 'edit' ? modal.todo.id : 'create'} />}
    </>
  )
}
