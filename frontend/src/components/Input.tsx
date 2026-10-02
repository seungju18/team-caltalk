import { useId, type InputHTMLAttributes } from 'react'
import { useLang } from '../hooks/useLang'

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }

export default function Input({ label, error, hint, className = '', ...rest }: Props) {
  const id = useId()
  const { te } = useLang()
  const noteId = `${id}-note`
  const note = error ? te(error) : hint
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm text-fg-muted mb-1">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`h-9 w-full px-3 rounded-sm bg-bg border text-fg placeholder:text-fg-subtle focus:border-primary text-base md:text-sm focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${error ? 'border-danger' : 'border-line-strong'}`}
        {...rest}
      />
      {note && (
        <p id={noteId} className={`text-xs mt-1 ${error ? 'text-danger' : 'text-fg-muted'}`}>
          {note}
        </p>
      )}
    </div>
  )
}
