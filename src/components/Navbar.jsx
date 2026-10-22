import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="TryBefore home">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="6" fill="#3f4a38" /><path d="M7 24V9h18v15" fill="none" stroke="#f7f4ec" strokeWidth="2" /><rect x="11" y="14" width="10" height="6" fill="#f7f4ec" /></svg>
      <span className="font-display text-[22px] leading-none">TryBefore</span>
    </Link>
  )
}

const LINKS = [['/examples', 'Examples'], ['/projects', 'My projects'], ['/settings', 'Settings']]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const cls = ({ isActive }) => `rounded px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-sage-deep' : 'text-ink-soft hover:text-ink'}`
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map(([to, label]) => <NavLink key={to} to={to} className={cls}>{label}</NavLink>)}
          <Link to="/create" className="ml-3 inline-flex h-10 items-center rounded-md bg-sage-deep px-4 text-sm font-medium text-ivory hover:bg-[#2f3829]">Design my room</Link>
        </nav>
        <button className="rounded p-2 md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-line bg-ivory px-5 py-3 md:hidden" aria-label="Mobile">
          {LINKS.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={`block ${cls({ isActive: false })}`}>{label}</NavLink>)}
          <Link to="/create" onClick={() => setOpen(false)} className="mt-2 block rounded-md bg-sage-deep px-4 py-2.5 text-center text-sm font-medium text-ivory">Design my room</Link>
        </nav>
      )}
    </header>
  )
}
