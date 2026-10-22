import { Link } from 'react-router-dom'
import { Logo } from './Navbar'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-linen/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            TryBefore is a room-design tool. Plans use the measurements you enter, and everything is saved in your browser.
          </p>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link className="hover:text-ink" to="/create">Design my room</Link></li>
            <li><Link className="hover:text-ink" to="/examples">Example rooms</Link></li>
            <li><Link className="hover:text-ink" to="/projects">My projects</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold">About this version</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>Layout checks run in your browser.</li>
            <li>AI suggestions and photo visualisation need a configured backend; otherwise rule-based and sample modes are used.</li>
            <li>Room pictures on this site are illustrations, not photographs.</li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
