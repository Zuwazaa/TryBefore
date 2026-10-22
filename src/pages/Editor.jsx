import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  FiArrowLeft, FiColumns, FiCpu, FiDollarSign, FiEye, FiEyeOff, FiGrid, FiImage, FiMaximize, FiRotateCcw,
  FiRotateCw, FiSave, FiSearch, FiShare2, FiSliders, FiZoomIn, FiZoomOut, FiCheckCircle, FiLayers, FiBox, FiMenu, FiX,
} from 'react-icons/fi'
import { useApp } from '../context/AppContext'
import { useHistory } from '../hooks/useHistory'
import { Button, IconButton, Modal, Notice } from '../components/ui'
import RoomCanvas from '../components/RoomCanvas'
import FurnitureLibrary from '../components/FurnitureLibrary'
import RoomObjects from '../components/RoomObjects'
import FurnitureProperties from '../components/FurnitureProperties'
import RoomMeasurements from '../components/RoomMeasurements'
import LayoutValidation from '../components/LayoutValidation'
import LayoutSuggestions, { CompareModal } from '../components/LayoutSuggestions'
import AIDesignPanel from '../components/AIDesignPanel'
import BudgetPanel from '../components/BudgetPanel'
import VisualizationPanel from '../components/VisualizationPanel'
import ExportControls from '../components/ExportControls'
import Navbar from '../components/Navbar'
import { evaluate } from '../lib/geometry'
import { makeItem, catalogByType } from '../lib/catalog'
import { clamp, uid } from '../lib/units'

const TABS = [
  { id: 'props', label: 'Edit', icon: FiSliders },
  { id: 'check', label: 'Check', icon: FiCheckCircle },
  { id: 'layouts', label: 'Layouts', icon: FiLayers },
  { id: 'ai', label: 'AI', icon: FiCpu },
  { id: 'budget', label: 'Budget', icon: FiDollarSign },
  { id: 'photo', label: 'Photo', icon: FiImage },
]

const sameLayout = (a, b) =>
  a.length === b.length && a.every((f, i) => { const g = b[i]; return g && g.id === f.id && g.x === f.x && g.y === f.y && g.rotation === f.rotation && g.w === f.w && g.d === f.d })

function EditorInner({ initial }) {
  const { saveProject, settings, toast } = useApp()
  const [initialDoc] = useState(() => ({ room: initial.room, furniture: initial.furniture }))
  const [initialMeta] = useState(() => ({
    name: initial.name, unit: initial.unit, layouts: initial.layouts, rules: initial.rules, budget: initial.budget.total,
    photo: initial.photo, visualizations: initial.visualizations,
  }))
  const baseFurniture = useRef(initial.layouts.find((l) => l.source === 'original')?.furniture || initial.furniture)
  const history = useHistory(initialDoc)
  const { doc } = history
  const [meta, setMeta] = useState(initialMeta)
  const [saved, setSaved] = useState({ doc: initialDoc, meta: initialMeta })
  const [selection, setSelection] = useState(null)
  const [tab, setTab] = useState('props')
  const [leftTab, setLeftTab] = useState('furniture')
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [snap, setSnap] = useState(true)
  const [showZones, setShowZones] = useState(true)
  const [modal, setModal] = useState(null)
  const canvasRef = useRef(null)
  const coalesce = useRef({ key: null, t: 0 })

  const evaluation = useMemo(() => evaluate(doc.room, doc.furniture, meta.rules), [doc, meta.rules])
  const patchMeta = useCallback((patch) => setMeta((m) => ({ ...m, ...patch })), [])
  const dirty = saved.doc !== doc || saved.meta !== meta

  const composed = useMemo(() => ({
    id: initial.id, createdAt: initial.createdAt, example: initial.example,
    name: meta.name, unit: meta.unit, room: doc.room, furniture: doc.furniture, layouts: meta.layouts,
    rules: meta.rules, budget: { total: meta.budget }, photo: meta.photo, visualizations: meta.visualizations,
  }), [initial, meta, doc])
  const composedRef = useRef(composed)
  composedRef.current = composed
  const snapshot = useRef({ doc, meta })
  snapshot.current = { doc, meta }

  const doSave = useCallback((quiet) => {
    const ok = saveProject(composedRef.current)
    if (ok) { setSaved(snapshot.current); if (!quiet) toast('Project saved.', 'success') }
  }, [saveProject, toast])

  useEffect(() => {
    if (!dirty || !settings.autosave) return undefined
    const t = setTimeout(() => doSave(true), 1200)
    return () => clearTimeout(t)
  }, [dirty, settings.autosave, doSave, doc, meta])

  // ----- editing actions -----
  const edit = useCallback((key, fn) => {
    const now = Date.now()
    const merge = key && coalesce.current.key === key && now - coalesce.current.t < 700
    coalesce.current = { key, t: now }
    ;(merge ? history.replace : history.set)(fn)
  }, [history])

  const updateItem = useCallback((id, patch, { coalesceKey } = {}) => {
    edit(coalesceKey ?? null, (d) => ({ ...d, furniture: d.furniture.map((f) => (f.id === id ? { ...f, ...patch } : f)) }))
  }, [edit])

  const typedUpdate = useCallback((id, patch) => updateItem(id, patch, { coalesceKey: `i:${id}:${Object.keys(patch).join()}` }), [updateItem])

  const updateOpening = useCallback((id, patch, opts = {}) => {
    const fn = (d) => ({ ...d, room: { ...d.room, openings: d.room.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)) } })
    if (opts.live) history.replace(fn)
    else edit(`o:${id}:${Object.keys(patch).join()}`, fn)
  }, [history, edit])

  const updateRoom = useCallback((patch) => edit(`room:${Object.keys(patch).join()}`, (d) => ({ ...d, room: { ...d.room, ...patch } })), [edit])

  const addItem = useCallback((type, x, y) => {
    const spec = catalogByType[type]
    const room = doc.room
    const g = meta.rules.grid
    const stagger = doc.furniture.filter((f) => f.type === type).length * 20
    const cx = clamp(x ?? room.length / 2 + stagger, spec.w / 2, Math.max(spec.w / 2, room.length - spec.w / 2))
    const cy = clamp(y ?? room.width / 2 + stagger, spec.d / 2, Math.max(spec.d / 2, room.width - spec.d / 2))
    const item = makeItem(type, { x: Math.round(cx / g) * g, y: Math.round(cy / g) * g })
    history.set((d) => ({ ...d, furniture: [...d.furniture, item] }))
    setSelection({ kind: 'item', id: item.id })
    setTab('props')
    setLeftOpen(false)
    return item
  }, [doc, meta.rules.grid, history])

  const addItems = useCallback((types) => types.forEach((t) => addItem(t)), [addItem])

  const addOpening = useCallback((kind) => {
    const width = kind === 'door' ? 90 : 120
    const op = { id: uid('o'), kind, wall: 'left', width, offset: Math.max(0, Math.round((doc.room.width - width) / 2 / 5) * 5) }
    history.set((d) => ({ ...d, room: { ...d.room, openings: [...d.room.openings, op] } }))
    setSelection({ kind: 'opening', id: op.id })
    setTab('props')
  }, [doc, history])

  const removeSelected = useCallback(() => {
    if (!selection) return
    if (selection.kind === 'item') history.set((d) => ({ ...d, furniture: d.furniture.filter((f) => f.id !== selection.id) }))
    else history.set((d) => ({ ...d, room: { ...d.room, openings: d.room.openings.filter((o) => o.id !== selection.id) } }))
    setSelection(null)
  }, [selection, history])

  const duplicateSelected = useCallback(() => {
    if (selection?.kind !== 'item') return
    const src = doc.furniture.find((f) => f.id === selection.id)
    if (!src) return
    const off = Math.max(20, meta.rules.grid * 2)
    const copy = { ...src, id: uid('f'), name: `${src.name} copy`, x: src.x + off, y: src.y + off }
    history.set((d) => ({ ...d, furniture: [...d.furniture, copy] }))
    setSelection({ kind: 'item', id: copy.id })
  }, [selection, doc, history, meta.rules.grid])

  const rotateSelected = useCallback(() => {
    if (selection?.kind !== 'item') return
    const src = doc.furniture.find((f) => f.id === selection.id)
    if (src) updateItem(src.id, { rotation: (Math.round(src.rotation / 90) * 90 + 90) % 360 })
  }, [selection, doc, updateItem])

  // ----- layouts -----
  const applyFurniture = useCallback((furniture, label) => {
    const current = doc.furniture
    if (sameLayout(current, furniture)) { toast('The plan already looks like this.'); return }
    if (!meta.layouts.some((l) => sameLayout(l.furniture, current)) && current.length) {
      patchMeta({ layouts: [...meta.layouts, { id: uid('l'), name: `Before “${label}”`, source: 'auto', createdAt: Date.now(), furniture: current }] })
    }
    history.set((d) => ({ ...d, furniture }))
    setSelection(null)
    toast(`Applied “${label}”. Undo goes back, and the previous plan is kept under Saved layouts.`, 'success')
  }, [doc.furniture, meta.layouts, history, patchMeta, toast])

  const saveLayout = useCallback((name, furniture = doc.furniture) => {
    patchMeta({ layouts: [...meta.layouts, { id: uid('l'), name, source: 'manual', createdAt: Date.now(), furniture }] })
    toast(`Saved layout “${name}”.`, 'success')
  }, [doc.furniture, meta.layouts, patchMeta, toast])

  const resetLayout = () => {
    history.set((d) => ({ ...d, furniture: baseFurniture.current }))
    setSelection(null)
    setModal(null)
    toast('Layout reset to how this project started. Undo brings your changes back.')
  }

  // ----- keyboard -----
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? history.redo() : history.undo() }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); history.redo() }
      else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); doSave(false) }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected() }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (selection) { e.preventDefault(); removeSelected() } }
      else if (e.key.toLowerCase() === 'r' && !mod) { rotateSelected() }
      else if (e.key === 'Escape') setSelection(null)
      else if (selection?.kind === 'item' && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? meta.rules.grid * 5 : meta.rules.grid
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        const src = doc.furniture.find((f) => f.id === selection.id)
        if (src) updateItem(src.id, { x: src.x + dx, y: src.y + dy }, { coalesceKey: `nudge:${src.id}` })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [history, selection, doc, doSave, duplicateSelected, removeSelected, rotateSelected, updateItem, meta.rules.grid])

  const compareOptions = useMemo(() => [{ id: 'current', name: 'Current plan', furniture: doc.furniture }, ...meta.layouts.map((l) => ({ id: l.id, name: l.name, furniture: l.furniture }))], [doc.furniture, meta.layouts])
  const fromCanvas = useCallback((sel) => { setSelection(sel); if (sel) setTab('props') }, [])

  const saveLabel = dirty ? (settings.autosave ? 'Saving soon…' : 'Unsaved changes') : 'All changes saved'

  const rightContent = {
    props: (
      <FurnitureProperties selection={selection} doc={doc} unit={meta.unit} onItemChange={typedUpdate} onOpeningChange={updateOpening} onRoomChange={updateRoom} onDuplicate={duplicateSelected} onDelete={removeSelected} />
    ),
    check: (
      <div className="space-y-6">
        <RoomMeasurements room={doc.room} furniture={doc.furniture} evaluation={evaluation} unit={meta.unit} />
        <LayoutValidation evaluation={evaluation} rules={meta.rules} unit={meta.unit} onRules={(p) => patchMeta({ rules: { ...meta.rules, ...p } })} onSelect={(s) => { setSelection(s); setRightOpen(false) }} />
      </div>
    ),
    layouts: (
      <LayoutSuggestions doc={doc} rules={meta.rules} unit={meta.unit} layouts={meta.layouts} onApply={applyFurniture} onSaveLayout={saveLayout}
        onDeleteLayout={(id) => patchMeta({ layouts: meta.layouts.filter((l) => l.id !== id) })} onCompare={() => setModal('compare')} />
    ),
    ai: <AIDesignPanel doc={doc} rules={meta.rules} unit={meta.unit} onApply={applyFurniture} onAddItems={addItems} />,
    budget: <BudgetPanel furniture={doc.furniture} layouts={meta.layouts} budget={meta.budget} onBudget={(b) => patchMeta({ budget: b })} onItemChange={typedUpdate} isExample={!!initial.example} />,
    photo: <VisualizationPanel photo={meta.photo} onPhoto={(p) => patchMeta({ photo: p })} visualizations={meta.visualizations} toast={toast}
      onSave={(v) => patchMeta({ visualizations: [v, ...meta.visualizations] })} onDelete={(id) => patchMeta({ visualizations: meta.visualizations.filter((v) => v.id !== id) })} />,
  }
  const problems = evaluation.problemCount

  return (
    <div className="flex h-dvh flex-col bg-ivory">
      <header className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-paper px-2 py-1.5 sm:px-3">
        <Link to="/projects" aria-label="Back to projects" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-linen"><FiArrowLeft aria-hidden /></Link>
        <input
          aria-label="Project name"
          value={meta.name}
          maxLength={80}
          onChange={(e) => patchMeta({ name: e.target.value })}
          onBlur={() => !meta.name.trim() && patchMeta({ name: initial.name })}
          className="font-display h-9 w-40 shrink-0 rounded-md border border-transparent bg-transparent px-2 text-lg hover:border-line focus:border-sage focus:bg-ivory focus:outline-none sm:w-64"
        />
        <span className={`hidden shrink-0 text-xs md:inline ${dirty ? 'text-ochre' : 'text-ink-soft'}`} role="status">{saveLabel}</span>
        <div className="mx-1 hidden h-6 w-px shrink-0 bg-line sm:block" />
        <IconButton label="Undo (Ctrl+Z)" icon={FiRotateCcw} onClick={history.undo} disabled={!history.canUndo} />
        <IconButton label="Redo (Ctrl+Shift+Z)" icon={FiRotateCw} onClick={history.redo} disabled={!history.canRedo} />
        <div className="mx-1 h-6 w-px shrink-0 bg-line" />
        <IconButton label="Zoom out" icon={FiZoomOut} onClick={() => canvasRef.current?.zoomOut()} />
        <IconButton label="Zoom in" icon={FiZoomIn} onClick={() => canvasRef.current?.zoomIn()} />
        <IconButton label="Fit room to screen" icon={FiMaximize} onClick={() => canvasRef.current?.fit()} />
        <IconButton label={snap ? 'Grid snapping on' : 'Grid snapping off'} icon={FiGrid} active={snap} onClick={() => setSnap((s) => !s)} />
        <IconButton label={showZones ? 'Hide door clearance zones' : 'Show door clearance zones'} icon={showZones ? FiEye : FiEyeOff} active={showZones} onClick={() => setShowZones((s) => !s)} />
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button size="sm" className="hidden lg:inline-flex" onClick={() => setModal('reset')} icon={FiRotateCcw}>Reset layout</Button>
          <Button size="sm" className="hidden sm:inline-flex" icon={FiColumns} onClick={() => setModal('compare')}>Compare</Button>
          <Button size="sm" icon={FiShare2} onClick={() => setModal('export')}><span className="hidden sm:inline">Export</span></Button>
          <Button size="sm" variant="primary" icon={FiSave} onClick={() => doSave(false)}>Save</Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {(leftOpen || rightOpen) && <div className="absolute inset-0 z-20 bg-ink/30 lg:hidden" onClick={() => { setLeftOpen(false); setRightOpen(false) }} aria-hidden />}

        <aside aria-label="Furniture and room objects" className={`absolute inset-y-0 left-0 z-30 flex w-[min(19rem,90vw)] flex-col border-r border-line bg-ivory transition-transform lg:static lg:w-72 lg:translate-x-0 ${leftOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex shrink-0 border-b border-line" role="tablist" aria-label="Left panel">
            {[['furniture', 'Furniture', FiBox], ['room', 'Openings', FiSearch]].map(([id, label, Icon]) => (
              <button key={id} role="tab" aria-selected={leftTab === id} onClick={() => setLeftTab(id)} className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium ${leftTab === id ? 'border-sage-deep text-sage-deep' : 'border-transparent text-ink-soft hover:text-ink'}`}>
                <Icon aria-hidden size={15} />{label}
              </button>
            ))}
            <button className="px-3 lg:hidden" aria-label="Close panel" onClick={() => setLeftOpen(false)}><FiX /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
            {leftTab === 'furniture' ? <FurnitureLibrary onAdd={(t) => addItem(t)} unit={meta.unit} /> : <RoomObjects room={doc.room} unit={meta.unit} selection={selection} onSelect={fromCanvas} onAdd={addOpening} />}
          </div>
        </aside>

        <main className="relative min-w-0 flex-1" aria-label="Room plan">
          <RoomCanvas
            ref={canvasRef}
            room={doc.room}
            furniture={doc.furniture}
            issues={evaluation.issues}
            selection={selection}
            onSelect={fromCanvas}
            onItemChange={(id, patch) => updateItem(id, patch)}
            onOpeningChange={updateOpening}
            onOpeningStart={history.checkpoint}
            onDropItem={(type, x, y) => addItem(type, x, y)}
            grid={meta.rules.grid}
            snap={snap}
            unit={meta.unit}
            showZones={showZones}
            rules={meta.rules}
          />
          {doc.furniture.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center px-4">
              <Notice className="pointer-events-auto max-w-sm bg-paper shadow-panel">The room is empty. Drag furniture in from the left, or press the + button on an item.</Notice>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 lg:hidden">
            <Button size="sm" variant="primary" icon={FiMenu} onClick={() => { setLeftOpen(true); setRightOpen(false) }}>Furniture</Button>
            <Button size="sm" variant="primary" icon={FiSliders} onClick={() => { setRightOpen(true); setLeftOpen(false) }}>Panels{problems ? ` · ${problems}` : ''}</Button>
          </div>
          <div className={`pointer-events-none absolute left-3 top-3 hidden rounded-md px-2.5 py-1 text-xs font-medium shadow-panel sm:block ${problems ? 'bg-brick-wash text-brick' : 'bg-sage-wash text-sage-deep'}`}>
            {problems ? `${problems} layout problem${problems > 1 ? 's' : ''}` : 'Layout checks passed'}
          </div>
        </main>

        <aside aria-label="Properties and tools" className={`absolute inset-y-0 right-0 z-30 flex w-[min(24rem,94vw)] flex-col border-l border-line bg-ivory transition-transform lg:static lg:w-[22rem] lg:translate-x-0 ${rightOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex shrink-0 border-b border-line" role="tablist" aria-label="Tools">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} title={t.label}
                className={`relative flex flex-1 cursor-pointer flex-col items-center gap-0.5 border-b-2 px-1 py-2 text-[11px] font-medium ${tab === t.id ? 'border-sage-deep text-sage-deep' : 'border-transparent text-ink-soft hover:text-ink'}`}>
                <t.icon aria-hidden size={16} />{t.label}
                {t.id === 'check' && problems > 0 && <span className="absolute right-1.5 top-1 min-w-4 rounded-full bg-brick px-1 text-[10px] leading-4 text-white">{problems}</span>}
              </button>
            ))}
            <button className="px-2 lg:hidden" aria-label="Close panel" onClick={() => setRightOpen(false)}><FiX /></button>
          </div>
          <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-4 scroll-thin">{rightContent[tab]}</div>
        </aside>
      </div>

      <ExportControls open={modal === 'export'} onClose={() => setModal(null)} project={composed} toast={toast} />
      {modal === 'compare' && <CompareModal open onClose={() => setModal(null)} options={compareOptions} doc={doc} rules={meta.rules} unit={meta.unit} />}
      <Modal open={modal === 'reset'} onClose={() => setModal(null)} title="Reset the layout?">
        <p className="text-sm text-ink-soft">Furniture goes back to how this project started. You can undo this with Ctrl+Z.</p>
        <div className="mt-5 flex justify-end gap-2"><Button onClick={() => setModal(null)}>Keep current</Button><Button variant="danger" onClick={resetLayout}>Reset layout</Button></div>
      </Modal>
    </div>
  )
}

export default function Editor() {
  const { projectId } = useParams()
  const { getProject } = useApp()
  const project = getProject(projectId)
  if (!project) {
    return (
      <div className="min-h-full">
        <Navbar />
        <main className="mx-auto max-w-lg px-5 pt-24 text-center">
          <h1 className="text-4xl">Project not found</h1>
          <p className="mt-3 text-ink-soft">This project may have been deleted, or it was saved in a different browser. Projects are stored on this device only.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/projects" className="inline-flex h-10 items-center rounded-md bg-sage-deep px-4 text-sm font-medium text-ivory">My projects</Link>
            <Link to="/create" className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium hover:bg-sage-wash">Create a room</Link>
          </div>
        </main>
      </div>
    )
  }
  return <EditorInner key={projectId} initial={project} />
}
