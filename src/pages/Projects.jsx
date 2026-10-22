import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiFolder, FiPlus, FiUpload } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProjectCard from '../components/ProjectCard'
import { Button, EmptyState, Input, Modal, Notice } from '../components/ui'
import { useApp } from '../context/AppContext'
import { exportProjectJSON } from '../lib/storage'
import { downloadText, slug } from '../lib/image'

export default function Projects() {
  const { projects, warning, dismissWarning, renameProject, duplicateProject, deleteProject, importProject, toast } = useApp()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [renaming, setRenaming] = useState(null)
  const [name, setName] = useState('')
  const [deleting, setDeleting] = useState(null)

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 12 * 1024 * 1024) { toast('That file is too large to be a TryBefore project.', 'error'); return }
    const res = importProject(await file.text())
    if (res.error) toast(res.error, 'error')
    else { toast(`Imported “${res.project.name}”.`, 'success'); navigate(`/editor/${res.project.id}`) }
  }

  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl">My projects</h1>
            <p className="mt-1 text-sm text-ink-soft">Saved in this browser. Export a project as JSON to back it up or move it.</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={onImport} aria-label="Import project JSON" />
            <Button icon={FiUpload} onClick={() => fileRef.current?.click()}>Import JSON</Button>
            <Button variant="primary" icon={FiPlus} onClick={() => navigate('/create')}>New project</Button>
          </div>
        </div>

        {warning && (
          <Notice tone="warn" className="mt-6 flex items-start justify-between gap-4">
            <span>{warning}</span>
            <button className="cursor-pointer font-medium underline" onClick={dismissWarning}>Dismiss</button>
          </Notice>
        )}

        <div className="mt-8">
          {projects.length === 0 ? (
            <EmptyState icon={FiFolder} title="No projects yet" action={<div className="flex gap-2"><Button variant="primary" onClick={() => navigate('/create')}>Create a room</Button><Link to="/examples" className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium hover:bg-sage-wash">Browse examples</Link></div>}>
              Create a room from its measurements, or open an example to see how the editor works.
            </EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onRename={(pr) => { setRenaming(pr); setName(pr.name) }}
                  onDuplicate={(pr) => { const c = duplicateProject(pr.id); if (c) toast(`Created “${c.name}”.`, 'success') }}
                  onExport={(pr) => downloadText(exportProjectJSON(pr), `${slug(pr.name)}.trybefore.json`)}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="Rename project">
        <form onSubmit={(e) => { e.preventDefault(); if (renameProject(renaming.id, name)) { setRenaming(null); toast('Project renamed.', 'success') } }}>
          <Input autoFocus value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label="Project name" />
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setRenaming(null)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!name.trim()}>Save name</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete this project?">
        <p className="text-sm text-ink-soft">“{deleting?.name}” and its layouts will be removed from this browser. This cannot be undone. Export it first if you may want it back.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setDeleting(null)}>Keep project</Button>
          <Button variant="danger" onClick={() => { deleteProject(deleting.id); setDeleting(null); toast('Project deleted.') }}>Delete project</Button>
        </div>
      </Modal>
    </div>
  )
}
