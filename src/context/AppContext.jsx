import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadProjects, persistProjects, loadSettings, persistSettings, parseImportedProject } from '../lib/storage'
import { uid } from '../lib/units'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const initial = useRef(null)
  if (!initial.current) initial.current = loadProjects()
  const [projects, setProjects] = useState(initial.current.projects)
  const [warning, setWarning] = useState(initial.current.warning)
  const [settings, setSettingsState] = useState(loadSettings)
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, kind = 'info') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3200)
  }, [])

  const commit = useCallback((next) => {
    const res = persistProjects(next)
    if (!res.ok) { toast(res.error, 'error'); return false }
    setProjects(next)
    return true
  }, [toast])

  // keep tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'trybefore.projects.v1') setProjects(loadProjects().projects)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const getProject = useCallback((id) => projects.find((p) => p.id === id) || null, [projects])

  const saveProject = useCallback((project) => {
    const saved = { ...project, updatedAt: Date.now() }
    const exists = projects.some((p) => p.id === saved.id)
    const next = exists ? projects.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...projects]
    return commit(next) ? saved : null
  }, [projects, commit])

  const duplicateProject = useCallback((id) => {
    const src = projects.find((p) => p.id === id)
    if (!src) return null
    const copy = { ...structuredClone(src), id: uid('p'), name: `${src.name} (copy)`, createdAt: Date.now(), updatedAt: Date.now(), example: null }
    return commit([copy, ...projects]) ? copy : null
  }, [projects, commit])

  const renameProject = useCallback((id, name) => {
    const clean = name.trim()
    if (!clean) return false
    return commit(projects.map((p) => (p.id === id ? { ...p, name: clean.slice(0, 80), updatedAt: Date.now() } : p)))
  }, [projects, commit])

  const deleteProject = useCallback((id) => commit(projects.filter((p) => p.id !== id)), [projects, commit])

  const importProject = useCallback((text) => {
    const res = parseImportedProject(text)
    if (res.error) return res
    return commit([res.project, ...projects]) ? { project: res.project } : { error: 'Could not store the imported project.' }
  }, [projects, commit])

  const setSettings = useCallback((patch) => {
    setSettingsState((s) => {
      const next = { ...s, ...patch }
      persistSettings(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ projects, warning, dismissWarning: () => setWarning(null), settings, setSettings, getProject, saveProject, duplicateProject, renameProject, deleteProject, importProject, toast }),
    [projects, warning, settings, setSettings, getProject, saveProject, duplicateProject, renameProject, deleteProject, importProject, toast],
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`rise pointer-events-auto max-w-md rounded-md px-4 py-2.5 text-sm shadow-panel ${t.kind === 'error' ? 'bg-brick text-white' : t.kind === 'success' ? 'bg-sage-deep text-ivory' : 'bg-ink text-ivory'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
