import { useEffect, useId, useRef } from 'react'
import { FiX } from 'react-icons/fi'

const BTN = {
  primary: 'bg-sage-deep text-ivory hover:bg-[#2f3829] disabled:bg-line disabled:text-ink-soft',
  secondary: 'border border-line bg-paper text-ink hover:border-sage hover:bg-sage-wash disabled:opacity-50',
  ghost: 'text-ink hover:bg-linen disabled:opacity-50',
  danger: 'bg-brick text-white hover:bg-[#9c4130]',
  quiet: 'text-sage-deep underline-offset-4 hover:underline',
}
const SIZE = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-[15px]' }

export function Button({ variant = 'secondary', size = 'md', className = '', icon: Icon, children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${BTN[variant]} ${SIZE[size]} ${className}`}
    >
      {Icon && <Icon aria-hidden className="shrink-0" size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  )
}

export function IconButton({ label, icon: Icon, active, className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${active ? 'bg-sage-wash text-sage-deep' : 'text-ink hover:bg-linen'} ${className}`}
    >
      <Icon aria-hidden size={17} />
    </button>
  )
}

export function Field({ label, hint, error, children, className = '' }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium text-ink">{label}</label>
      {typeof children === 'function' ? children(id) : children}
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs text-brick">{error}</p>}
    </div>
  )
}

export const inputClass =
  'h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink placeholder:text-ink-soft/70 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25'

export function Input({ className = '', ...rest }) {
  return <input {...rest} className={`${inputClass} ${className}`} />
}

export function Select({ className = '', children, ...rest }) {
  return <select {...rest} className={`${inputClass} pr-8 ${className}`}>{children}</select>
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-5 w-9 rounded-full bg-line transition-colors peer-checked:bg-sage peer-focus-visible:outline-2 peer-focus-visible:outline-sage after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
      {label}
    </label>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const prev = document.activeElement
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/45 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`rise max-h-[90vh] w-full overflow-auto rounded-lg bg-ivory p-5 shadow-panel focus:outline-none ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-xl">{title}</h2>
          <IconButton label="Close" icon={FiX} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  )
}

export function Notice({ tone = 'info', children, className = '' }) {
  const tones = {
    info: 'border-line bg-paper text-ink-soft',
    warn: 'border-[#e2cf9b] bg-ochre-wash text-ochre',
    error: 'border-[#e7bcb0] bg-brick-wash text-brick',
    ok: 'border-[#c4d0b6] bg-sage-wash text-sage-deep',
  }
  return <div className={`rounded-md border px-3 py-2 text-[13px] leading-relaxed ${tones[tone]} ${className}`}>{children}</div>
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line px-6 py-10 text-center">
      {Icon && <Icon aria-hidden size={26} className="mb-3 text-sage" />}
      <h3 className="text-lg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }) {
  const tones = { neutral: 'bg-linen text-ink-soft', sage: 'bg-sage-wash text-sage-deep', brick: 'bg-brick-wash text-brick', ochre: 'bg-ochre-wash text-ochre' }
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-line bg-paper p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`cursor-pointer rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${value === o.value ? 'bg-sage-deep text-ivory' : 'text-ink hover:bg-linen'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
