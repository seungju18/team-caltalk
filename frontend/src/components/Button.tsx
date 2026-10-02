import type { ButtonHTMLAttributes } from 'react'

const VARIANTS = {
  primary: 'h-10 px-4 rounded-sm bg-primary text-white font-bold hover:bg-primary-hover',
  secondary: 'h-9 px-3 rounded-sm border border-line-strong bg-surface text-fg hover:bg-surface-hover',
  danger: 'h-9 px-3 rounded-sm border border-line-strong bg-surface text-danger hover:bg-surface-hover',
  icon: 'h-9 w-9 inline-flex items-center justify-center rounded-sm border border-line-strong bg-surface',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }

export default function Button({ variant = 'secondary', type = 'button', className = '', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`${VARIANTS[variant]} text-sm disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${className}`}
      {...rest}
    />
  )
}
