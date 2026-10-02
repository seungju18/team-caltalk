import { useId } from 'react'
import Button from './Button'
import ConfirmDialog from './ConfirmDialog'
import TodoForm from './TodoForm'
import { useTodoForm } from '../hooks/useTodoForm'
import { useLang } from '../hooks/useLang'

// 모바일은 전체 화면, md 이상은 가운데 패널 (WF-05)
export default function TodoModal() {
  const f = useTodoForm()
  const titleId = useId()
  const { t, te } = useLang()
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={f.submit}
        noValidate
        className="bg-surface border border-line shadow-lg p-6 fixed inset-0 overflow-y-auto md:static md:rounded md:max-w-md md:w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={titleId} className="text-lg font-bold">
            {f.isEdit ? t('todo.edit') : t('todo.create')}
          </h2>
          <Button variant="icon" onClick={f.close} aria-label={t('common.close')}>
            ✕
          </Button>
        </div>
        <TodoForm f={f} />
        {f.formError && (
          <p role="alert" className="text-xs text-danger mt-4">
            {te(f.formError)}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-6">
          {f.isEdit && (
            <Button variant="danger" className="mr-auto" onClick={f.askDelete} disabled={f.isSaving}>
              {t('common.delete')}
            </Button>
          )}
          <Button onClick={f.close} disabled={f.isSaving}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" disabled={f.isSaving}>
            {f.isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
      {f.isConfirmingDelete && (
        <ConfirmDialog
          title={t('todo.deleteTitle')}
          message={[t('todo.deleteConfirm', { title: f.originalTitle }), t('todo.deleteWarn')]}
          onConfirm={f.confirmDelete}
          onCancel={f.cancelDelete}
          isPending={f.isDeleting}
          error={f.deleteError ?? undefined}
        />
      )}
    </div>
  )
}
