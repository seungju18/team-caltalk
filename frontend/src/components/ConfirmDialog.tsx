import { useId } from 'react'
import Button from './Button'
import { useLang } from '../hooks/useLang'

type Props = {
  title: string
  message: string[]
  onConfirm(): void
  onCancel(): void
  isPending: boolean
  error?: string
}

export default function ConfirmDialog({ title, message, onConfirm, onCancel, isPending, error }: Props) {
  const titleId = useId()
  const { t, te } = useLang()
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface border border-line rounded shadow-lg w-full max-w-md p-6"
      >
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        {message.map((line) => (
          <p key={line} className="text-sm mt-2">
            {line}
          </p>
        ))}
        {error && <p className="text-xs text-danger mt-2">{te(error)}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onCancel} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isPending}>
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}
