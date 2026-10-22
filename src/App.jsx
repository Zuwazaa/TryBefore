import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'

const Editor = lazy(() => import('./pages/Editor'))
import Landing from './pages/Landing'
import Create from './pages/Create'
import Projects from './pages/Projects'
import Examples from './pages/Examples'
import Settings from './pages/Settings'
import Navbar from './components/Navbar'

function NotFound() {
  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-lg px-5 pt-24 text-center">
        <h1 className="text-4xl">Page not found</h1>
        <p className="mt-3 text-ink-soft">That address does not lead anywhere in TryBefore.</p>
        <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-md bg-sage-deep px-4 text-sm font-medium text-ivory">Back to the start</Link>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/create" element={<Create />} />
      <Route path="/editor/:projectId" element={<Suspense fallback={<p className="p-10 text-center text-ink-soft">Opening the editor…</p>}><Editor /></Suspense>} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/examples" element={<Examples />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
